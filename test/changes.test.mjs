import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {runner} from '../src/runner.ts';
import {git,snapshot} from '../src/changes.ts';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function finished(app,id){for(let i=0;i<200;i++){const row=app.request({op:'show',id}).task;if(['succeeded','failed'].includes(row.status))return row;await sleep(10);}throw Error('Timeout');}
async function checked(app,id){for(let i=0;i<200;i++){const t=app.request({op:'show',id}).task;const checks=JSON.parse(t.checks??'{}');if(checks.status&&checks.status!=='running')return checks;await sleep(10);}throw Error('Timeout');}
function setup(){const root=mkdtempSync(join(tmpdir(),'changes-')),repo=join(root,'repo');mkdirSync(repo);git(repo,['init','-b','main']);writeFileSync(join(repo,'README.md'),'before\n');writeFileSync(join(repo,'package-lock.json'),'{}');git(repo,['add','.']);git(repo,['-c','user.name=test','-c','user.email=test@localhost','commit','-m','fixture']);return {root,repo};}
test('edit snapshot includes new files; checks and commit approval are bound to exact content',async()=>{
 const f=setup();let pass=true;
 const app=runner({repo:f.repo,stateDir:join(f.root,'state'),worktrees:join(f.root,'trees'),logs:join(f.root,'logs'),editing:true,
  command:()=>[process.execPath,['-e',"require('fs').writeFileSync('README.md','edited\\n');require('fs').writeFileSync('new.txt','new\\n')"]],
  isolate:(_tree,_state,command,args,adapter)=>({command:adapter?command:process.execPath,args:adapter?args:['-e',pass?'console.log("checks passed")':'process.exit(1)'],cleanup(){}})});
 await once(app.server,'listening');
 try{
  const task=app.request({op:'create',adapter:'codex',prompt:'edit',mode:'edit'});assert.equal(task.status,'waiting_for_approval');
  assert.throws(()=>app.request({op:'review',id:task.id}),/finished/);app.request({op:'approve',id:task.id});const done=await finished(app,task.id);assert.equal(done.review,'pending');
  assert.equal(readFileSync(join(f.repo,'README.md'),'utf8'),'before\n');let review=app.request({op:'review',id:task.id});assert.ok(review.files.includes('new.txt'));
  assert.throws(()=>app.request({op:'commit',id:task.id,tree:review.tree,message:'Approved'}),/Checks must pass/);
  assert.throws(()=>app.request({op:'create',adapter:'codex',prompt:'continue',conversation:task.conversation}),/Commit or discard/);
  app.request({op:'project-checks',id:'default',dependencies:f.repo});
  pass=false;app.request({op:'validate',id:task.id,tree:review.tree});assert.equal((await checked(app,task.id)).status,'failed');
  assert.throws(()=>app.request({op:'commit',id:task.id,tree:review.tree,message:'Approved'}),/Checks must pass/);
  pass=true;app.request({op:'validate',id:task.id,tree:review.tree});assert.equal((await checked(app,task.id)).status,'passed');
  writeFileSync(join(done.worktree,'new.txt'),'changed after review');
  assert.throws(()=>app.request({op:'commit',id:task.id,tree:review.tree,message:'Approved'}),/changed/);
  review=app.request({op:'review',id:task.id});assert.throws(()=>app.request({op:'commit',id:task.id,tree:review.tree,message:'Approved'}),/Checks must pass/);
  app.request({op:'validate',id:task.id,tree:review.tree});await checked(app,task.id);
  const committed=app.request({op:'commit',id:task.id,tree:review.tree,message:'Approved edits'});assert.equal(committed.review,'committed');
  assert.equal(git(f.repo,['show',committed.commit_sha+':new.txt']),'changed after review');assert.equal(git(f.repo,['branch','--show-current']),'main');assert.equal(readFileSync(join(f.repo,'README.md'),'utf8'),'before\n');
  const next=app.request({op:'create',adapter:'codex',prompt:'continue',conversation:task.conversation});assert.equal(next.revision,committed.commit_sha);
  assert.throws(()=>app.request({op:'commit',id:task.id,tree:review.tree,message:'Again'}),/resolved/);
 }finally{await app.close();rmSync(f.root,{recursive:true,force:true});}
});
test('attachment input is excluded from snapshots and sensitive filenames are flagged',()=>{
 const f=setup();const state=join(f.root,'state');mkdirSync(state);try{mkdirSync(join(f.repo,'.agentd-input'));writeFileSync(join(f.repo,'.agentd-input','photo.png'),'private');writeFileSync(join(f.repo,'.env'),'SECRET=value');const value=snapshot(f.repo,git(f.repo,['rev-parse','HEAD']),state);assert.deepEqual(value.files,['.env']);assert.deepEqual(value.blocked,['.env']);}finally{rmSync(f.root,{recursive:true,force:true});}
});
