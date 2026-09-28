import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {cursorPermission,cursorCredentials,cursorSettings,cursorCredentialPath,cursorVersion} from '../src/cursor-policy.ts';
import {loginDetails,saveLogin} from '../src/accounts.ts';
import {workerCredentials,expiresAt} from '../src/credentials.ts';
const exec=promisify(execFile);
const login='https://cursor.com/loginDeepControl?challenge='+ 'a'.repeat(43)+'&uuid=12345678-1234-1234-1234-123456789abc&mode=login&redirectTarget=cli&supportsSelectedTeamLogin=true';
test('Cursor login accepts only the native browser URL and publishes browser credentials plus a sanitized team selection',()=>{
 assert.equal(loginDetails('cursor',login+'\n').url,login);
 for(const bad of [login.replace('cursor.com','evil.test'),login+'&token=secret',login.replace('https:','http:'),login.replace('mode=login','mode=other'),login.replace('redirectTarget=cli','redirectTarget=web')])assert.equal(loginDetails('cursor',bad).url,null);
 const root=mkdtempSync(join(tmpdir(),'cursor-account-')),source=join(root,'source'),target=join(root,'target'),file=join(source,cursorCredentialPath);mkdirSync(dirname(file),{recursive:true});mkdirSync(join(source,'.cursor'),{recursive:true});mkdirSync(target);
 try{
  writeFileSync(file,JSON.stringify({accessToken:'access-fixture',refreshToken:'refresh-fixture',privateIdentity:'discard'}));writeFileSync(join(source,'.cursor/cli-config.json'),JSON.stringify({authInfo:{activeTeamId:123,email:'hidden'},permissions:{allow:['Shell(*)']},hooks:{unsafe:true}}));saveLogin('cursor',source,target);
  assert.deepEqual(JSON.parse(readFileSync(join(target,cursorCredentialPath),'utf8')),{accessToken:'access-fixture',refreshToken:'refresh-fixture'});assert.deepEqual(JSON.parse(readFileSync(join(target,'.cursor/cli-config.json'),'utf8')),cursorSettings(123));
  const before=readFileSync(join(target,cursorCredentialPath),'utf8');writeFileSync(file,JSON.stringify({accessToken:'new',refreshToken:'refresh',apiKey:'forbidden'}));assert.throws(()=>saveLogin('cursor',source,target));assert.equal(readFileSync(join(target,cursorCredentialPath),'utf8'),before);
  rmSync(file);symlinkSync('/etc/passwd',file);assert.throws(()=>saveLogin('cursor',source,target));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('Cursor worker credentials never include a refresh grant or API credentials',()=>{
 const access='header.'+Buffer.from(JSON.stringify({exp:2000000000})).toString('base64url')+'.signature';
 const credentials={accessToken:access,refreshToken:'real-refresh-grant'};assert.deepEqual(workerCredentials('cursor',credentials),{accessToken:access});assert.equal(expiresAt('cursor',credentials),2000000000000);
 for(const v of [null,{}, {...credentials,apiKey:'api-key'},{...credentials,bedrockCredentials:{} }])assert.throws(()=>cursorCredentials(v));
});
test('Cursor permission gate permits only explicit worktree diffs once, rejects escapes, hooks, tools and other sessions',()=>{
 const root=mkdtempSync(join(tmpdir(),'cursor-policy-'));symlinkSync('/tmp',join(root,'link'));
 const request=path=>({sessionId:'session',toolCall:{kind:'edit',content:[{type:'diff',path,newText:'safe'}]},options:[{kind:'allow_once',optionId:'allow-once'},{kind:'allow_always',optionId:'allow-always'}]});
 const decision=(p,mode='edit')=>cursorPermission(p,mode,root,'session').outcome;
 try{
  assert.equal(decision(request('src/new.ts')).outcome,'selected');assert.equal(decision(request(join(root,'file'))).optionId,'allow-once');
  for(const path of ['../outside','/etc/passwd','.git/config','.cursor/hooks.json','src/.claude/settings.json','.agentd-input/secret','link/escape'])assert.equal(decision(request(path)).outcome,'cancelled',path);
  for(const p of [null,{...request('safe'),sessionId:'other'},{...request('safe'),options:null},{...request('safe'),toolCall:{kind:'execute'}},{...request('safe'),toolCall:{kind:'edit',content:[null]}},{...request('safe'),toolCall:{kind:'edit'}}])assert.equal(decision(p).outcome,'cancelled');assert.equal(decision(request('safe'),'ask').outcome,'cancelled');
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('Cursor ACP negotiates no client tools, sends literal prompts, filters output and fails closed on requests and failed tools',async()=>{
 const root=mkdtempSync(join(tmpdir(),'cursor-protocol-')),bin=join(root,'cursor-agent'),wrapper=new URL('../src/cursor-acp.ts',import.meta.url).pathname;
 writeFileSync(bin,`#!${process.execPath}
if(process.argv.includes('--version')){console.log('${cursorVersion}');process.exit(0)}
const rl=require('readline').createInterface({input:process.stdin});const send=v=>console.log(JSON.stringify({jsonrpc:'2.0',...v}));
rl.on('line',line=>{const m=JSON.parse(line);if(!m.method)return;
 if(m.method==='initialize'){if(m.params.clientCapabilities.terminal!==false||m.params.clientCapabilities.fs.writeTextFile!==false||m.params.clientCapabilities.subagents)process.exit(3);send({id:m.id,result:{protocolVersion:1}})}
 else if(m.method==='session/new'){if(m.params.mcpServers.length)process.exit(4);send({id:m.id,result:{sessionId:'session'}})}
 else if(m.method==='session/prompt'){const text=m.params.prompt[0].text;
  if(text==='malformed'){console.log('null');return}
  if(text==='tool')send({id:99,method:'terminal/create',params:{command:'forbidden'}});
  if(text==='permission')send({id:99,method:'session/request_permission',params:{sessionId:'session',toolCall:{kind:'execute'},options:[]}});
  if(text==='failed')send({method:'session/update',params:{sessionId:'session',update:{sessionUpdate:'tool_call_update',status:'failed'}}});
  send({method:'session/update',params:{sessionId:'other',update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text:'OTHER_SESSION'}}}});
  send({method:'session/update',params:{sessionId:'session',update:{sessionUpdate:'agent_thought_chunk',content:{type:'text',text:'PRIVATE_THOUGHT'}}}});
  send({method:'session/update',params:{sessionId:'session',update:{sessionUpdate:'agent_message_chunk',content:{type:'text',text}}}});send({id:m.id,result:{stopReason:'end_turn'}});
 }else send({id:m.id,result:{}});
});`,{mode:0o700});
 try{
  const prompt='$(touch BAD)\n--force literal';const ok=await exec(process.execPath,[wrapper,bin,'ask',prompt],{cwd:root,timeout:10000});assert.equal(ok.stdout,prompt);assert.equal(ok.stderr,'');
  for(const prompt of ['tool','permission','failed','malformed'])await assert.rejects(exec(process.execPath,[wrapper,bin,'edit',prompt],{cwd:root,timeout:10000}));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('Cursor expiry requires reconnect without attempting an API-key refresh',async()=>{
 const {renewals}=await import('../src/renewal.ts');const root=mkdtempSync(join(tmpdir(),'cursor-expiry-')),file=join(root,cursorCredentialPath);mkdirSync(dirname(file),{recursive:true});let called=0;
 const manager=renewals({home:root,stateDir:root,renew:async()=>{called++;}});
 try{for(const [exp,ready] of [[Math.floor(Date.now()/1000)+3600,true],[Math.floor(Date.now()/1000)+30,false]]){writeFileSync(file,JSON.stringify({accessToken:'h.'+Buffer.from(JSON.stringify({exp})).toString('base64url')+'.s',refreshToken:'preserved'}));assert.equal(manager.view('cursor').state,ready?'ready':'reconnect_required');if(ready)await manager.ensure('cursor');else await assert.rejects(manager.ensure('cursor'),/Reconnect Cursor/);}assert.equal(called,0);assert.equal(JSON.parse(readFileSync(file,'utf8')).refreshToken,'preserved');}
 finally{await manager.close();rmSync(root,{recursive:true,force:true});}
});
test('Cursor account status requires a verified native identity but never returns it',async()=>{
 const {probeAccount}=await import('../src/adapters.ts');const root=mkdtempSync(join(tmpdir(),'cursor-status-')),file=join(root,cursorCredentialPath),bin=join(root,'cursor-agent'),prior=process.env.AGENTD_CURSOR_BIN;mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify({accessToken:'access',refreshToken:'refresh'}));process.env.AGENTD_CURSOR_BIN=bin;
 try{for(const verified of [true,false]){writeFileSync(bin,`#!${process.execPath}\nconsole.log(${JSON.stringify(JSON.stringify({status:'authenticated',isAuthenticated:true,...(verified?{userInfo:{email:'private@example.test'}}:{})}))});`,{mode:0o700});const value=await probeAccount('cursor',root);assert.equal(value.state,verified?'signed_in':'error');assert.ok(!JSON.stringify(value).includes('private@'));}}
 finally{if(prior===undefined)delete process.env.AGENTD_CURSOR_BIN;else process.env.AGENTD_CURSOR_BIN=prior;rmSync(root,{recursive:true,force:true});}
});
test('Cursor cannot be enabled without hardened workers and access-only credential handling',async()=>{
 const {runner}=await import('../src/runner.ts');for(const c of [{},{strictWorkers:true},{credentialRenewal:true}])assert.throws(()=>runner({enabledAdapters:['cursor'],...c}),/Cursor requires hardened/);
});
