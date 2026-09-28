// No account or model use: isolated ACP initialize with synthetic access-only credentials.
import {mkdtempSync,mkdirSync,rmSync,writeFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {homedir,tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {git} from '../src/changes.ts';
import {isolated} from '../src/isolation.ts';
import {cursorCredentialPath} from '../src/cursor-policy.ts';
const binary=process.env.AGENTD_CURSOR_BIN??join(homedir(),'.local/bin/cursor-agent'),root=mkdtempSync(join(tmpdir(),'cursor-preflight-')),repo=join(root,'repo'),tree=join(root,'tree'),state=join(root,'state'),home=join(root,'home'),prior=process.env.HOME;
let box;
try{
 for(const p of [repo,state,home])mkdirSync(p);git(repo,['init','-b','main']);git(repo,['-c','user.name=agentd','-c','user.email=agentd@localhost','commit','--allow-empty','-m','fixture']);git(repo,['worktree','add','--detach',tree,'HEAD']);
 const file=join(home,cursorCredentialPath);mkdirSync(dirname(file),{recursive:true});writeFileSync(file,JSON.stringify({accessToken:'synthetic-offline-access',refreshToken:'synthetic-refresh-never-mounted'}),{mode:0o600});process.env.HOME=home;
 box=isolated(tree,state,process.execPath,[new URL('../src/cursor-probe.ts',import.meta.url).pathname,binary],'cursor',undefined,true,false,{accessOnly:true});
 const result=execFileSync(box.command,box.args,{encoding:'utf8',timeout:30000,env:{HOME:home,PATH:process.env.PATH,LANG:'C.UTF-8',TERM:'dumb'},stdio:['ignore','pipe','pipe']});if(!result.includes('CURSOR_ACP_OK'))throw Error('Cursor startup not verified');console.log('cursor: pinned native ACP starts inside the restricted editing sandbox; no sign-in or model request');
}finally{box?.cleanup();if(prior===undefined)delete process.env.HOME;else process.env.HOME=prior;rmSync(root,{recursive:true,force:true});}
