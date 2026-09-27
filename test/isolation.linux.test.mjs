import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {isolated} from '../src/isolation.ts';
import {git} from '../src/changes.ts';
test('Linux sandbox allows worktree writes and denies Git metadata writes',{skip:process.env.AGENTD_TEST_ISOLATION!=='1'},()=>{
 const root=mkdtempSync(join(tmpdir(),'isolate-')),repo=join(root,'repo'),tree=join(root,'tree'),state=join(root,'state');mkdirSync(repo);mkdirSync(state);git(repo,['init','-b','main']);git(repo,['-c','user.name=test','-c','user.email=test@localhost','commit','--allow-empty','-m','base']);git(repo,['worktree','add','--detach',tree,'HEAD']);
 const config=join(repo,'.git/config'),before=readFileSync(config,'utf8');
 const script=`import pathlib\np=pathlib.Path('allowed.txt');p.write_text('allowed')\nfor name in ['.git',${JSON.stringify(config)}]:\n try:\n  open(name,'a').write('forbidden')\n except OSError:\n  pass\n else:\n  raise RuntimeError('Git metadata was writable')\nprint('ISOLATION_OK')`;
 let sandbox;
 try{sandbox=isolated(tree,state,'/usr/bin/python3',['-c',script]);assert.match(execFileSync(sandbox.command,sandbox.args,{encoding:'utf8',timeout:10000}),/ISOLATION_OK/);assert.equal(readFileSync(join(tree,'allowed.txt'),'utf8'),'allowed');assert.equal(readFileSync(config,'utf8'),before);}finally{sandbox?.cleanup();rmSync(root,{recursive:true,force:true});}
});
