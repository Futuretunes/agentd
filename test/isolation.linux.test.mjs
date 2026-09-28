import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync,symlinkSync,realpathSync} from 'node:fs';
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
test('chat isolation hides repository files, Git metadata and project hooks',{skip:process.env.AGENTD_TEST_ISOLATION!=='1'},()=>{
 const root=mkdtempSync(join(tmpdir(),'chat-isolate-')),tree=join(root,'tree'),state=join(root,'state');mkdirSync(tree);mkdirSync(state);
 writeFileSync(join(tree,'SECRET'),'repository secret');writeFileSync(join(tree,'AGENTS.md'),'untrusted project instructions');
 const script=`import pathlib,socket,os,urllib.parse\nassert list(pathlib.Path('.').iterdir())==[]\nassert not pathlib.Path(${JSON.stringify(join(tree,'SECRET'))}).exists()\nassert not pathlib.Path(${JSON.stringify(state)}).exists()\ntry:\n pathlib.Path('written').write_text('bad')\nexcept OSError:\n pass\nelse:\n raise RuntimeError('chat workspace writable')\np=urllib.parse.urlparse(os.environ['HTTPS_PROXY'])\ns=socket.create_connection((p.hostname,p.port),timeout=5)\ns.sendall(b'CONNECT example.com:443 HTTP/1.1\\r\\n\\r\\n')\nassert b'403 Forbidden' in s.recv(1000)\nprint('CHAT_ISOLATION_OK')`;
 // args[1] is the mounted native executable in the real wrapper invocation.
 const check=join(root,'check.py'),alias=join(root,'native-alias');writeFileSync(check,script);symlinkSync('/usr/bin/python3',alias);
 let sandbox;
 try{sandbox=isolated(tree,state,'/usr/bin/python3',[check,alias],'codex',undefined,false,true);assert.ok(!sandbox.args.includes(alias));assert.ok(sandbox.args.includes(realpathSync(alias)));
 // Add only the trusted test script; no repo or daemon state mount.
 sandbox.args.splice(sandbox.args.indexOf('--'),0,'--ro-bind',check,check);
 assert.match(execFileSync(sandbox.command,sandbox.args,{encoding:'utf8',timeout:15000}),/CHAT_ISOLATION_OK/);
 assert.equal(readFileSync(join(tree,'SECRET'),'utf8'),'repository secret');
 }finally{sandbox?.cleanup();rmSync(root,{recursive:true,force:true});}
});
