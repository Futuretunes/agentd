import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {discover,invocation,probeAccount} from '../src/adapters.ts';
test('native adapter invocations preserve sandbox, tools and literal user arguments',()=>{
 const prompt='literal $(touch unwanted); --dangerously-skip-permissions';
 const [,codex]=invocation('codex',{prompt,mode:'edit',images:['/tmp/a photo.png']});
 assert.equal(codex[codex.indexOf('--sandbox')+1],'workspace-write');assert.equal(codex.at(-1),prompt);assert.equal(codex[codex.indexOf('--image')+1],'/tmp/a photo.png');assert.ok(!codex.includes('--dangerously-bypass-approvals-and-sandbox'));
 const [,ask]=invocation('codex',{prompt,mode:'ask',images:[]});assert.equal(ask[ask.indexOf('--sandbox')+1],'read-only');
 const [,claude]=invocation('claude',{prompt,mode:'ask',images:[]});assert.equal(claude[claude.indexOf('--tools')+1],'Read,Glob,Grep');assert.equal(claude[claude.indexOf('--permission-mode')+1],'dontAsk');assert.equal(claude.at(-1),prompt);
 const [,edit]=invocation('claude',{prompt,mode:'edit',images:[]});assert.equal(edit[edit.indexOf('--allowedTools')+1],'Read,Glob,Grep,Edit,Write');
 assert.throws(()=>invocation('unknown',{prompt,mode:'ask',images:[]}),/Unsupported/);assert.throws(()=>invocation('claude',{prompt,mode:'unsafe',images:[]}),/Unsupported/);
});
test('account probes return only normalized status and never raw identity output',async()=>{
 const root=mkdtempSync(join(tmpdir(),'account-')),bin=join(root,'claude'),prior=process.env.AGENTD_CLAUDE_BIN;
 try{
  process.env.AGENTD_CLAUDE_BIN=bin;writeFileSync(bin,"#!/bin/sh\nprintf 'Login method: Claude Pro account\\nEmail: private@example.test\\n'\n",{mode:0o700});
  const signedIn=await probeAccount('claude');assert.deepEqual(signedIn.state,'signed_in');assert.equal(signedIn.method,'Claude subscription');assert.ok(!JSON.stringify(signedIn).includes('private@example.test'));
  writeFileSync(bin,"#!/bin/sh\nprintf 'Not logged in. Run login to authenticate.\\n'\nexit 1\n",{mode:0o700});const signedOut=await probeAccount('claude');assert.equal(signedOut.state,'signed_out');assert.equal(signedOut.method,null);
  rmSync(bin);const missing=await probeAccount('claude');assert.equal(missing.state,'unavailable');assert.ok(!JSON.stringify(missing).includes(bin));
 }finally{if(prior===undefined)delete process.env.AGENTD_CLAUDE_BIN;else process.env.AGENTD_CLAUDE_BIN=prior;rmSync(root,{recursive:true,force:true});}
});
test('discovery distinguishes installation from policy without running CLI or checking credentials',()=>{
 const root=mkdtempSync(join(tmpdir(),'adapters-')),bin=join(root,'cli');const prior=process.env.AGENTD_CLAUDE_BIN;
 try{
  process.env.AGENTD_CLAUDE_BIN=bin;
  let value=discover(['claude'],['claude']).find(x=>x.id==='claude');assert.equal(value.installed,false);assert.equal(value.available,false);assert.match(value.reason,/missing/);
  writeFileSync(bin,'not executed');chmodSync(bin,0o600);assert.equal(discover(['claude'],[]).find(x=>x.id==='claude').available,false);
  chmodSync(bin,0o700);value=discover(['claude'],['claude']).find(x=>x.id==='claude');assert.equal(value.available,true);assert.deepEqual(value.modes,['ask','edit']);assert.equal(value.authentication,'not_checked');assert.ok(!JSON.stringify(value).includes(bin));
  value=discover([],['claude']).find(x=>x.id==='claude');assert.equal(value.installed,true);assert.equal(value.available,false);assert.match(value.reason,/security policy/);assert.deepEqual(value.modes,[]);
 }finally{if(prior===undefined)delete process.env.AGENTD_CLAUDE_BIN;else process.env.AGENTD_CLAUDE_BIN=prior;rmSync(root,{recursive:true,force:true});}
});
test('chat-only policy exposes no repository modes and rejects image or other-provider chat',()=>{
 const value=discover(['claude'],['claude'],true,true).find(x=>x.id==='codex');assert.deepEqual(value.modes,['chat']);assert.equal(value.available,true);
 const [command,args]=invocation('codex',{prompt:'--unsafe $(touch file)',mode:'chat',images:[]});assert.equal(command,process.execPath);assert.match(args[0],/codex-chat\.ts$/);assert.equal(args.at(-2),'--unsafe $(touch file)');
 assert.throws(()=>invocation('claude',{prompt:'test',mode:'chat',images:[]}));assert.throws(()=>invocation('codex',{prompt:'test',mode:'chat',images:['image']}));
});

test('native versions are normalized and fixed limits match actual invocation arguments',async()=>{
 const {probeNativeVersion}=await import('../src/adapters.ts');const {testedVersions,claudeMaxTurns}=await import('../src/native-policy.ts');
 const root=mkdtempSync(join(tmpdir(),'native-version-')),bin=join(root,'claude'),prior=process.env.AGENTD_CLAUDE_BIN;
 try{
  process.env.AGENTD_CLAUDE_BIN=bin;
  const script=value=>writeFileSync(bin,'#!/bin/sh\nprintf "%s\\n" '+JSON.stringify(value)+'\n',{mode:0o700});
  script(testedVersions.claude);assert.equal((await probeNativeVersion('claude')).state,'verified');
  script('9.9.9 (Claude Code)');const mismatch=await probeNativeVersion('claude');assert.equal(mismatch.state,'mismatch');assert.equal(mismatch.version,'9.9.9 (Claude Code)');
  script('private@example.invalid /private/profile');const unknown=await probeNativeVersion('claude');assert.equal(unknown.state,'unavailable');assert.equal(unknown.version,null);assert.ok(!JSON.stringify(unknown).includes('private@'));
  const value=discover(['claude'],['claude']).find(v=>v.id==='claude'),[,args]=invocation('claude',{prompt:'fixture',mode:'edit',images:[]});assert.equal(value.nativeLimits.maxTurns,claudeMaxTurns);assert.equal(args[args.indexOf('--max-turns')+1],String(value.nativeLimits.maxTurns));
 }finally{if(prior===undefined)delete process.env.AGENTD_CLAUDE_BIN;else process.env.AGENTD_CLAUDE_BIN=prior;rmSync(root,{recursive:true,force:true});}
});
