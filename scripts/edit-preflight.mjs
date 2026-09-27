// Run as the service user. No model calls unless --live is supplied explicitly.
import {mkdtempSync,mkdirSync,rmSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {execFileSync} from 'node:child_process';
import {git} from '../src/changes.ts';
import {isolated} from '../src/isolation.ts';
const root=mkdtempSync('/srv/agentd/tmp/edit-preflight-'),repo=join(root,'repo'),state=join(root,'state');mkdirSync(repo);mkdirSync(state);
try{
 git(repo,['init','-b','main']);git(repo,['-c','user.name=agentd','-c','user.email=agentd@localhost','commit','--allow-empty','-m','Preflight fixture']);
 for(const adapter of ['codex','claude']){
  const tree=join(root,adapter);git(repo,['worktree','add','--detach',tree,'HEAD']);
  const command=join(homedir(),'.local/bin',adapter),live=process.argv.includes('--live');
  const prompt='Create a file named CHECK.txt containing exactly EDIT_OK followed by a newline. Do not commit, use the network, or modify any other file.';
  const args=!live?['--help']:adapter==='codex'?['-c','forced_login_method="chatgpt"','exec','--sandbox','workspace-write','--ephemeral',prompt]:['-p','--permission-mode','dontAsk','--tools','Read,Glob,Grep,Edit,Write','--allowedTools','Read,Glob,Grep,Edit,Write','--max-turns','8',prompt];
  const sandbox=isolated(tree,state,command,args,adapter);
  try{
   execFileSync(sandbox.command,sandbox.args,{cwd:tree,env:{PATH:process.env.PATH,HOME:homedir(),LANG:'C.UTF-8',TERM:'dumb'},timeout:live?180000:30000,stdio:['ignore','pipe','pipe']});
   if(live&&readFileSync(join(tree,'CHECK.txt'),'utf8').trim()!=='EDIT_OK')throw Error(adapter+' did not create the expected edit');
   console.log(adapter+': '+(live?'native edit verified':'CLI starts inside editing sandbox'));
  }catch(error){
   console.error(adapter+': preflight failed: '+error.message.split('\n')[0]);
   // Never print provider-auth files or arbitrary CLI diagnostics from this helper.
   process.exitCode=1;
  }finally{sandbox.cleanup();}
 }
}finally{rmSync(root,{recursive:true,force:true});}
