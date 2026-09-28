import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
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
  for(let i=0;i<100&&probes.size!==2;i++)await sleep(10);
  assert.equal(probes.size,2);
  const signedOut={state:'signed_out',method:null,checkedAt:null,message:'Sign-in required'};
  probes.get('claude')(signedOut);await sleep(0);
  assert.throws(()=>f.app.request({op:'account-start',owner,adapter:'claude',action:'login'}),/account checks/);
  probes.get('codex')(signedOut);await sleep(0);
  const session=f.app.request({op:'account-start',owner,adapter:'claude',action:'login'});
  assert.equal(f.app.request({op:'operations'}).service.accountChange,true);
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
  await a.close();const restarted=runner(f.config);await once(restarted.server,'listening');assert.equal(restarted.request({op:'show',id:last.id}).task.status,'interrupted');await restarted.close();
 }finally{rmSync(f.root,{recursive:true,force:true});}
});
test('hung worker hits timeout',async()=>{
 const f=await fixture(100);try{const t=f.app.request({op:'create',adapter:'claude',prompt:'hang'});f.app.request({op:'approve',id:t.id});await status(f.app,t.id,['timed_out']);}finally{await f.app.close();rmSync(f.root,{recursive:true,force:true});}
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
