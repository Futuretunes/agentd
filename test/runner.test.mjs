import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFile,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {runner} from '../src/runner.ts';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function fixture(timeoutMs=2000,accountStatus=async()=>({state:'signed_out',method:null,checkedAt:null,message:'Sign-in required'})){
 const root=mkdtempSync(join(tmpdir(),'runner-')),repo=join(root,'repo');mkdirSync(repo);
 const git=(...args)=>execFileSync('git',['-C',repo,...args],{stdio:'pipe'});
 git('init','-b','main');writeFileSync(join(repo,'README.md'),'fixture');git('add','.');git('-c','user.name=test','-c','user.email=test@localhost','commit','-m','fixture');
 const config={stateDir:join(root,'state'),repo,worktrees:join(root,'trees'),logs:join(root,'logs'),timeoutMs,command:(_adapter,prompt)=>[process.execPath,['-e',prompt==='hang'?'setInterval(()=>{},1000)':prompt==='fail'?'process.exit(7)':"console.log(require('fs').readFileSync('README.md','utf8'))"]]};
 config.accountStatus=accountStatus;
 const app=runner(config);await once(app.server,'listening');return{root,repo,config,app};
}
async function status(app,id,wanted){for(let i=0;i<150;i++){const row=app.request({op:'show',id}).task;if(wanted.includes(row.status))return row;await sleep(20);}throw Error('Timed out waiting for '+wanted);}
test('account changes exclude task approvals and running workers; audit excludes secrets',async()=>{
 const prior=process.env.AGENTD_CLAUDE_BIN,binRoot=mkdtempSync(join(tmpdir(),'account-cli-')),bin=join(binRoot,'claude');
 writeFileSync(bin,`#!${process.execPath}\nif(process.argv.includes('status')){console.log('Not logged in');process.exit(1)}setInterval(()=>{},1000);`,{mode:0o700});process.env.AGENTD_CLAUDE_BIN=bin;
 const probes=new Map();
 const f=await fixture(2000,id=>new Promise(resolve=>probes.set(id,resolve)));const owner='a'.repeat(64);
 try{
  const task=f.app.request({op:'create',adapter:'claude',prompt:'hang'});
  assert.deepEqual(f.app.request({op:'account-session'}),{session:null,busy:false});
  const cliOutput=await new Promise((resolve,reject)=>execFile(process.execPath,[new URL('../src/control.ts',import.meta.url).pathname,'account-session'],{env:{...process.env,AGENTD_CONTROL_SOCKET:join(f.config.stateDir,'control.sock')}},(error,stdout)=>error?reject(error):resolve(stdout)));
  assert.deepEqual(JSON.parse(cliOutput),{session:null,busy:false});
  for(let i=0;i<100&&probes.size!==2;i++)await sleep(10);
  assert.equal(probes.size,2);
  const signedOut={state:'signed_out',method:null,checkedAt:null,message:'Sign-in required'};
  probes.get('claude')(signedOut);await sleep(0);
  assert.throws(()=>f.app.request({op:'account-start',owner,adapter:'claude',action:'login'}),/account checks/);
  probes.get('codex')(signedOut);await sleep(0);
  const session=f.app.request({op:'account-start',owner,adapter:'claude',action:'login'});
  assert.equal(f.app.request({op:'operations'}).service.accountChange,true);
  assert.deepEqual(f.app.request({op:'account-session'}),{session:null,busy:true});
  assert.throws(()=>f.app.request({op:'approve',id:task.id}),/account change/);
  assert.equal(f.app.request({op:'account-session',owner:'b'.repeat(64)}).session,null);
  assert.ok(!JSON.stringify(f.app.request({op:'audit'})).includes(owner));
  f.app.request({op:'account-cancel',owner,session:session.id});
  for(let i=0;i<100&&f.app.request({op:'account-session',owner}).busy;i++)await sleep(20);
  f.app.request({op:'approve',id:task.id});await status(f.app,task.id,['running']);
  assert.throws(()=>f.app.request({op:'account-start',owner,adapter:'claude',action:'logout'}),/current work/);
 }finally{await f.app.close();rmSync(f.root,{recursive:true,force:true});if(prior===undefined)delete process.env.AGENTD_CLAUDE_BIN;else process.env.AGENTD_CLAUDE_BIN=prior;rmSync(binRoot,{recursive:true,force:true});}
});
test('approval is required; revisions and worktrees are pinned; state survives restart',async()=>{
 const f=await fixture();let app=f.app;
 try{
  assert.throws(()=>app.request({op:'create',adapter:'shell',prompt:'x'}));
  const task=app.request({op:'create',adapter:'codex',prompt:'read'});
  await sleep(50);assert.equal(app.request({op:'show',id:task.id}).task.status,'waiting_for_approval');
  app.request({op:'approve',id:task.id});assert.throws(()=>app.request({op:'approve',id:task.id}));
  const done=await status(app,task.id,['succeeded']);assert.equal(readFileSync(done.log,'utf8').trim(),'fixture');
  assert.equal(execFileSync('git',['-C',done.worktree,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),task.revision);
  const next=app.request({op:'create',adapter:'claude',prompt:'read'});app.request({op:'approve',id:next.id});
  const second=await status(app,next.id,['succeeded']);assert.notEqual(second.worktree,done.worktree);
  await app.close();app=runner(f.config);await once(app.server,'listening');assert.equal(app.request({op:'show',id:task.id}).task.status,'succeeded');
 }finally{await app.close();rmSync(f.root,{recursive:true,force:true});}
});
test('single worker cancellation failure and graceful interruption',async()=>{
 const f=await fixture();const a=f.app;
 try{
  const first=a.request({op:'create',adapter:'codex',prompt:'hang'});a.request({op:'approve',id:first.id});await status(a,first.id,['running']);
  const second=a.request({op:'create',adapter:'claude',prompt:'fail'});a.request({op:'approve',id:second.id});await sleep(50);assert.equal(a.request({op:'show',id:second.id}).task.status,'queued');
  a.request({op:'cancel',id:first.id});await status(a,first.id,['cancelled']);await status(a,second.id,['failed']);
  const pending=a.request({op:'create',adapter:'claude',prompt:'read'});a.request({op:'cancel',id:pending.id});assert.equal(a.request({op:'show',id:pending.id}).task.status,'cancelled');
  const last=a.request({op:'create',adapter:'codex',prompt:'hang'});a.request({op:'approve',id:last.id});await status(a,last.id,['running']);
  await a.close();const restarted=runner(f.config);await once(restarted.server,'listening');assert.equal(restarted.request({op:'show',id:last.id}).task.status,'interrupted');assert.equal(restarted.request({op:'retry',id:last.id}).status,'waiting_for_approval');await restarted.close();
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('hung worker hits timeout',async()=>{
 const f=await fixture(100);try{const t=f.app.request({op:'create',adapter:'claude',prompt:'hang'});f.app.request({op:'approve',id:t.id});await status(f.app,t.id,['timed_out']);assert.equal(f.app.request({op:'retry',id:t.id}).status,'waiting_for_approval');}finally{await f.app.close();rmSync(f.root,{recursive:true,force:true});}
});
test('adapter policy rejects new and previously pending work; approvals are audited',async()=>{
 const f=await fixture();let app=f.app;
 try{
  const pending=app.request({op:'create',adapter:'codex',prompt:'private prompt'});
  await app.close();app=runner({...f.config,enabledAdapters:['claude'],editing:true,editAdapters:['claude']});await once(app.server,'listening');
  assert.throws(()=>app.request({op:'approve',id:pending.id}),/disabled/);
  assert.throws(()=>app.request({op:'create',adapter:'codex',prompt:'private prompt'}),/disabled/);
  assert.deepEqual(app.request({op:'capabilities'}).editAdapters,['claude']);
  const allowed=app.request({op:'create',adapter:'claude',prompt:'private prompt'});app.request({op:'approve',id:allowed.id});await status(app,allowed.id,['succeeded']);
  const audit=app.request({op:'audit'});assert.equal(audit[0].action,'approve-run');assert.equal(audit[0].task,allowed.id);assert.ok(!JSON.stringify(audit).includes('private prompt'));
 }finally{await app.close();rmSync(f.root,{recursive:true,force:true});}
});
test('missing CLI blocks approval and dispatch even when it existed at creation',async()=>{
 const f=await fixture();await f.app.close();const prior=process.env.AGENTD_CLAUDE_BIN;let app;
 try{
  const binary=join(f.root,'native-cli');writeFileSync(binary,'#!/bin/sh\nexit 0\n',{mode:0o700});process.env.AGENTD_CLAUDE_BIN=binary;
  app=runner({...f.config,command:undefined,enabledAdapters:['claude']});await once(app.server,'listening');
  const task=app.request({op:'create',adapter:'claude',prompt:'read'});rmSync(binary);
  assert.throws(()=>app.request({op:'approve',id:task.id}),/missing/);assert.deepEqual(app.request({op:'capabilities'}).enabledAdapters,[]);
  writeFileSync(binary,'#!/bin/sh\nexit 0\n',{mode:0o700});app.request({op:'approve',id:task.id});rmSync(binary);
  const failed=await status(app,task.id,['failed']);assert.match(failed.error,/missing/);assert.equal(failed.worktree,null);
 }finally{await app?.close();if(prior===undefined)delete process.env.AGENTD_CLAUDE_BIN;else process.env.AGENTD_CLAUDE_BIN=prior;rmSync(f.root,{recursive:true,force:true});}
});

test('retry preserves original inputs and context, requires approval and survives duplicate requests and restart',async()=>{
 const f=await fixture();let app=f.app;
 try{
  const parent=app.request({op:'create',adapter:'claude',prompt:'read'});app.request({op:'approve',id:parent.id});await status(app,parent.id,['succeeded']);
  const image='11111111-1111-4111-8111-111111111111',images=join(f.config.stateDir,'attachments');
  writeFileSync(join(images,image+'.json'),JSON.stringify({id:image,ext:'.png',name:'fixture.png'}));writeFileSync(join(images,image+'.png'),'fixture');
  const original=app.request({op:'create',conversation:parent.conversation,adapter:'claude',prompt:'retry me',attachments:[image]});
  assert.throws(()=>app.request({op:'retry',id:original.id}),/Only stopped/);
  app.request({op:'cancel',id:original.id});
  // Advancing the project must not change the retry's pinned revision.
  execFileSync('git',['-C',f.repo,'-c','user.name=test','-c','user.email=test@localhost','commit','--allow-empty','-m','advance'],{stdio:'pipe'});
  const retry=app.request({op:'retry',id:original.id,prompt:'injected',adapter:'codex',revision:'HEAD',attachments:[]});
  assert.notEqual(retry.id,original.id);assert.equal(retry.retry_of,original.id);
  for(const key of ['prompt','adapter','mode','revision','attachments','parent','project','conversation'])assert.equal(retry[key],original[key],key);
  assert.equal(retry.status,'waiting_for_approval');assert.equal(retry.worktree,null);assert.equal(retry.log,null);
  assert.equal(app.request({op:'retry',id:original.id}).id,retry.id);
  await app.close();app=runner(f.config);await once(app.server,'listening');
  assert.equal(app.request({op:'retry',id:original.id}).id,retry.id);
  assert.equal(app.request({op:'show',id:original.id}).task.status,'cancelled');
  app.request({op:'approve',id:retry.id});const done=await status(app,retry.id,['succeeded']);
  assert.equal(execFileSync('git',['-C',done.worktree,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),original.revision);
  assert.equal(readFileSync(join(done.worktree,'.agentd-input',image+'.png'),'utf8'),'fixture');
  const audit=app.request({op:'audit'}).filter(item=>item.action==='retry-run');assert.equal(audit.length,1);assert.ok(!JSON.stringify(audit).includes('retry me'));
 }finally{await app.close();rmSync(f.root,{recursive:true,force:true});}
});
test('retry keeps failed worktrees and rejects stale turns, unavailable adapters and missing images',async()=>{
 const f=await fixture();let app=f.app;
 try{
  const original=app.request({op:'create',adapter:'claude',prompt:'fail'});app.request({op:'approve',id:original.id});const failed=await status(app,original.id,['failed']);
  const retry=app.request({op:'retry',id:original.id});app.request({op:'approve',id:retry.id});const again=await status(app,retry.id,['failed']);
  assert.notEqual(again.worktree,failed.worktree);assert.equal(readFileSync(join(failed.worktree,'README.md'),'utf8'),'fixture');
  const later=app.request({op:'create',conversation:original.conversation,adapter:'claude',prompt:'new turn'});app.request({op:'cancel',id:later.id});
  assert.throws(()=>app.request({op:'retry',id:retry.id}),/latest run/);
  const image='22222222-2222-4222-8222-222222222222';writeFileSync(join(f.config.stateDir,'attachments',image+'.json'),JSON.stringify({id:image,ext:'.png'}));
  const missing=app.request({op:'create',adapter:'claude',prompt:'image',attachments:[image]});app.request({op:'cancel',id:missing.id});
  assert.throws(()=>app.request({op:'retry',id:missing.id}),/image is missing/);
  app.request({op:'conversation-archive',id:later.conversation});assert.throws(()=>app.request({op:'retry',id:later.id}),/archived/);
  const disabled=app.request({op:'create',adapter:'codex',prompt:'read'});app.request({op:'cancel',id:disabled.id});
  await app.close();app=runner({...f.config,enabledAdapters:['claude']});await once(app.server,'listening');assert.throws(()=>app.request({op:'retry',id:disabled.id}),/disabled/);
 }finally{await app.close();rmSync(f.root,{recursive:true,force:true});}
});
test('retry protects partial edits until review is resolved',async()=>{
 const f=await fixture();await f.app.close();
 const app=runner({...f.config,editing:true,editAdapters:['claude'],command:(_adapter,prompt)=>[process.execPath,['-e',prompt.startsWith('hang')?'setInterval(()=>{},1000)':'process.exit(0)']],isolate:(_tree,_state,command,args)=>({command,args,cleanup(){}})});await once(app.server,'listening');
 try{
  const original=app.request({op:'create',adapter:'claude',mode:'edit',prompt:'read'});app.request({op:'approve',id:original.id});await status(app,original.id,['succeeded']);
  assert.throws(()=>app.request({op:'retry',id:original.id}),/Only stopped/);
  app.request({op:'discard',id:original.id});
  // A hanging edit can leave changes before cancellation.
  const edit=app.request({op:'create',adapter:'claude',mode:'edit',prompt:'hang'});app.request({op:'approve',id:edit.id});const working=await status(app,edit.id,['running']);
  writeFileSync(join(working.worktree,'partial.txt'),'keep me');app.request({op:'cancel',id:edit.id});await status(app,edit.id,['cancelled']);
  assert.throws(()=>app.request({op:'retry',id:edit.id}),/Review and discard/);
  app.request({op:'discard',id:edit.id});const retry=app.request({op:'retry',id:edit.id});assert.equal(retry.mode,'edit');assert.equal(retry.status,'waiting_for_approval');
  assert.equal(readFileSync(join(working.worktree,'partial.txt'),'utf8'),'keep me');assert.equal(retry.worktree,null);
 }finally{await app.close();rmSync(f.root,{recursive:true,force:true});}
});
