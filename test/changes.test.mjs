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
 const app=runner({repo:f.repo,stateDir:join(f.root,'state'),worktrees:join(f.root,'trees'),logs:join(f.root,'logs'),editing:true,editAdapters:['codex'],
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

test('revision requests preserve an exact uncommitted snapshot across restart and require fresh run/check/commit approval',async()=>{
 const f=setup(),config={repo:f.repo,stateDir:join(f.root,'state'),worktrees:join(f.root,'trees'),logs:join(f.root,'logs'),editing:true,editAdapters:['claude'],command:(_a,p)=>[process.execPath,['-e',p.includes('refine')?"const fs=require('fs');if(fs.readFileSync('new.txt','utf8')!=='saved')process.exit(4);fs.appendFileSync('README.md','refined\\n')":"const fs=require('fs');fs.writeFileSync('new.txt','saved');fs.writeFileSync('README.md','first\\n')"]],isolate:(_t,_s,command,args,adapter)=>({command:adapter?command:process.execPath,args:adapter?args:['-e',''],cleanup(){}})};
 let app=runner(config);await once(app.server,'listening');try{
  const first=app.request({op:'create',adapter:'claude',mode:'edit',prompt:'first'});app.request({op:'approve',id:first.id});const original=await finished(app,first.id),view=app.request({op:'review',id:first.id});
  assert.throws(()=>app.request({op:'revise',id:first.id,tree:'stale',prompt:'refine'}),/changed/);
  const next=app.request({op:'revise',id:first.id,tree:view.tree,prompt:'refine'});assert.equal(next.status,'waiting_for_approval');assert.equal(next.checks,null);assert.equal(next.revision,first.revision);assert.equal(next.worktree,null);assert.equal(app.request({op:'show',id:first.id}).task.review,'superseded');
  assert.equal(app.request({op:'revise',id:first.id,tree:view.tree,prompt:'refine'}).id,next.id);assert.throws(()=>app.request({op:'revise',id:first.id,tree:view.tree,prompt:'different'}),/different revision/);
  await app.close();app=runner(config);await once(app.server,'listening');writeFileSync(join(original.worktree,'new.txt'),'later change');
  app.request({op:'approve',id:next.id});const revised=await finished(app,next.id);assert.equal(revised.status,'succeeded');assert.notEqual(revised.worktree,original.worktree);assert.equal(readFileSync(join(revised.worktree,'new.txt'),'utf8'),'saved');assert.equal(readFileSync(join(original.worktree,'README.md'),'utf8'),'first\n');
  const review=app.request({op:'review',id:next.id});assert.match(review.patch,/refined/);assert.ok(review.files.includes('new.txt'));assert.throws(()=>app.request({op:'commit',id:next.id,tree:review.tree,message:'Refined'}),/Checks must pass/);
  app.request({op:'project-checks',id:'default',dependencies:f.repo});app.request({op:'validate',id:next.id,tree:review.tree});await checked(app,next.id);const commit=app.request({op:'commit',id:next.id,tree:review.tree,message:'Refined'});assert.equal(git(f.repo,['rev-parse',commit.commit_sha+'^']),first.revision);assert.equal(git(f.repo,['show',commit.commit_sha+':new.txt']),'saved');
 }finally{await app.close();rmSync(f.root,{recursive:true,force:true});}
});

test('cancelling an unstarted revision and retrying retains its snapshot',async()=>{const f=setup(),app=runner({repo:f.repo,stateDir:join(f.root,'state'),worktrees:join(f.root,'trees'),logs:join(f.root,'logs'),editing:true,editAdapters:['claude'],command:()=>[process.execPath,['-e',"require('fs').appendFileSync('README.md','next')"]],isolate:(_t,_s,command,args)=>({command,args,cleanup(){}})});await once(app.server,'listening');try{const first=app.request({op:'create',adapter:'claude',mode:'edit',prompt:'edit'});app.request({op:'approve',id:first.id});await finished(app,first.id);const view=app.request({op:'review',id:first.id}),next=app.request({op:'revise',id:first.id,tree:view.tree,prompt:'again'});app.request({op:'cancel',id:next.id});const retry=app.request({op:'retry',id:next.id});assert.equal(retry.seed_tree,view.tree);app.request({op:'approve',id:retry.id});const done=await finished(app,retry.id);assert.equal(readFileSync(join(done.worktree,'README.md'),'utf8'),'before\nnextnext');}finally{await app.close();rmSync(f.root,{recursive:true,force:true});}});
