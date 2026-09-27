import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {runner} from '../src/runner.ts';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function repo(root,name){const path=join(root,name);mkdirSync(path);const git=(...args)=>execFileSync('git',['-C',path,...args],{stdio:'pipe'});git('init','-b','main');writeFileSync(join(path,'README.md'),name);git('add','.');git('-c','user.name=test','-c','user.email=test@localhost','commit','-m','fixture');return path;}
async function done(app,id){for(let i=0;i<200;i++){const t=app.request({op:'show',id}).task;if(t.status==='succeeded')return t;if(t.status==='failed')throw Error(t.error);await sleep(10);}throw Error('Timeout');}
test('projects route work to the correct repository and keep conversations separate',async()=>{
 const root=mkdtempSync(join(tmpdir(),'projects-'));const config={stateDir:join(root,'state'),repo:repo(root,'original'),worktrees:join(root,'trees'),logs:join(root,'logs'),command:()=>[process.execPath,['-e',"console.log(require('fs').readFileSync('README.md','utf8'))"]]};let app=runner(config);await once(app.server,'listening');
 try{
  const project=app.request({op:'project-register',name:'Second',repo:repo(root,'second')});
  assert.throws(()=>app.request({op:'project-register',name:'bad',repo:root}),/Command failed/);
  const a=app.request({op:'create',project:project.id,adapter:'codex',prompt:'Read'});
  const b=app.request({op:'create',project:'default',adapter:'claude',prompt:'Other'});
  assert.throws(()=>app.request({op:'create',project:'default',conversation:a.conversation,adapter:'codex',prompt:'wrong'}),/another project/);
  assert.throws(()=>app.request({op:'create',project:project.id,conversation:a.conversation,adapter:'codex',prompt:'wait'}),/current turn/);
  app.request({op:'approve',id:a.id});const run=await done(app,a.id);assert.equal(readFileSync(run.log,'utf8').trim(),'second');
  const next=app.request({op:'create',conversation:a.conversation,project:project.id,adapter:'claude',prompt:'Continue'});assert.equal(next.parent,a.id);assert.equal(next.status,'waiting_for_approval');
  assert.throws(()=>app.request({op:'conversation-archive',id:a.conversation}),/pending/);
  app.request({op:'cancel',id:next.id});app.request({op:'conversation-rename',id:a.conversation,name:'Architecture'});
  const thread=app.request({op:'conversation-show',id:a.conversation});assert.equal(thread.messages.length,2);assert.equal(thread.conversation.title,'Architecture');
  assert.equal(app.request({op:'conversations',project:'default'}).length,1);
  assert.equal(app.request({op:'conversations',project:'default'})[0].id,b.conversation);
  const blank=app.request({op:'project-create',name:'Fresh project'});assert.equal(execFileSync('git',['-C',blank.repo,'rev-list','--count','HEAD'],{encoding:'utf8'}).trim(),'1');
  app.request({op:'conversation-archive',id:a.conversation});assert.equal(app.request({op:'conversations',project:project.id}).length,0);
  await app.close();app=runner(config);await once(app.server,'listening');assert.equal(app.request({op:'projects'}).length,3);assert.equal(app.request({op:'conversation-show',id:a.conversation}).messages.length,2);
 }finally{await app.close();rmSync(root,{recursive:true,force:true});}
});
test('legacy tasks migrate to their original project and preserve follow-up ancestry',async()=>{
 const root=mkdtempSync(join(tmpdir(),'migration-')),stateDir=join(root,'state');mkdirSync(stateDir);const db=new DatabaseSync(join(stateDir,'tasks.sqlite'));
 db.exec(`CREATE TABLE tasks(id TEXT PRIMARY KEY,adapter TEXT,prompt TEXT,revision TEXT,status TEXT,created TEXT,updated TEXT,worktree TEXT,log TEXT,error TEXT,attachments TEXT DEFAULT '[]',parent TEXT);`);
 const insert=db.prepare('INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,parent) VALUES(?,?,?,?,?,?,?,?)');insert.run('old','codex','Original','rev','succeeded','1','1',null);insert.run('follow','claude','Follow up','rev','succeeded','2','2','old');db.close();
 const app=runner({stateDir,repo:repo(root,'original'),worktrees:join(root,'trees'),logs:join(root,'logs')});await once(app.server,'listening');
 try{const threads=app.request({op:'conversations',project:'default'});assert.equal(threads.length,1);const data=app.request({op:'conversation-show',id:threads[0].id});assert.equal(data.messages.length,2);assert.equal(data.messages[1].parent,'old');}finally{await app.close();rmSync(root,{recursive:true,force:true});}
});
