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
 const secret=join(state,'hidden-secret');writeFileSync(secret,'sentinel');
 const config=join(repo,'.git/config'),before=readFileSync(config,'utf8');
 const script=`import pathlib\np=pathlib.Path('allowed.txt');p.write_text('allowed')\nfor name in ['.git',${JSON.stringify(config)}]:\n try:\n  open(name,'a').write('forbidden')\n except OSError:\n  pass\n else:\n  raise RuntimeError('Git metadata was writable')\nimport socket\nassert not pathlib.Path(${JSON.stringify(secret)}).exists()\nassert not pathlib.Path(${JSON.stringify(join(repo,'unrelated'))}).exists()\ns=socket.socket();s.settimeout(0.2)\nassert s.connect_ex(('192.168.1.1',443)) != 0\nprint('ISOLATION_OK')`;
 let sandbox;
 try{sandbox=isolated(tree,state,'/usr/bin/python3',['-c',script]);assert.match(execFileSync(sandbox.command,sandbox.args,{encoding:'utf8',timeout:10000}),/ISOLATION_OK/);assert.equal(readFileSync(join(tree,'allowed.txt'),'utf8'),'allowed');assert.equal(readFileSync(config,'utf8'),before);sandbox.cleanup();sandbox=isolated(tree,state,'/usr/bin/python3',['-c',"from pathlib import Path; Path('denied.txt').write_text('bad')"],undefined,undefined,false);assert.throws(()=>execFileSync(sandbox.command,sandbox.args,{stdio:'pipe',timeout:10000}));}finally{sandbox?.cleanup();rmSync(root,{recursive:true,force:true});}
});
test('isolated worker reaches only the selected provider proxy and cleans up',{skip:process.env.AGENTD_TEST_ISOLATION!=='1'},()=>{
 const root=mkdtempSync(join(tmpdir(),'relay-')),repo=join(root,'repo'),tree=join(root,'tree'),state=join(root,'state');mkdirSync(repo);mkdirSync(state);
 git(repo,['init','-b','main']);git(repo,['-c','user.name=test','-c','user.email=test@localhost','commit','--allow-empty','-m','base']);git(repo,['worktree','add','--detach',tree,'HEAD']);
 const script=`import os,socket,urllib.parse\np=urllib.parse.urlparse(os.environ['HTTPS_PROXY'])\ns=socket.create_connection((p.hostname,p.port),timeout=5)\ns.sendall(b'CONNECT example.com:443 HTTP/1.1\\r\\n\\r\\n')\nassert b'403 Forbidden' in s.recv(1000)\nprint('RELAY_OK')`;
 let sandbox;
 try{sandbox=isolated(tree,state,'/usr/bin/python3',['-c',script],'claude');assert.match(execFileSync(sandbox.command,sandbox.args,{encoding:'utf8',timeout:15000}),/RELAY_OK/);}finally{sandbox?.cleanup();rmSync(root,{recursive:true,force:true});}
});
