import {existsSync,copyFileSync,mkdirSync,rmSync,mkdtempSync,realpathSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {homedir} from 'node:os';
import {git} from './changes.ts';

// Editing fails closed unless Linux bubblewrap can establish this mount namespace.
// The provider login is deliberately available to its CLI inside the sandbox.
export function isolated(worktree:string,stateDir:string,command:string,args:string[],adapter?:string,dependencies?:string) {
  if(process.platform!=='linux')throw Error('Editing and checks require Linux with bubblewrap');
  const runtime=mkdtempSync(join(stateDir,'worker-')),home=join(runtime,'home');mkdirSync(home,{mode:0o700});
  try {
  const hostHome=homedir();
  if(adapter){
    const files=adapter==='codex'?['.codex/auth.json']:['.claude.json','.claude/.credentials.json'];
    for(const file of files){const source=join(hostHome,file);if(existsSync(source)){mkdirSync(join(home,file.split('/').slice(0,-1).join('/')),{recursive:true,mode:0o700});copyFileSync(source,join(home,file));}}
  }
  const common=realpathSync(resolve(worktree,git(worktree,['rev-parse','--git-common-dir'])));
  const executable=realpathSync(command);
  const mounts=['--die-with-parent','--new-session','--unshare-pid','--unshare-ipc','--ro-bind','/','/','--proc','/proc','--dev','/dev','--tmpfs','/tmp','--tmpfs','/run','--tmpfs','/home',
    '--tmpfs',stateDir,'--bind',home,hostHome];
  if(existsSync('/run/systemd/resolve'))mounts.push('--ro-bind','/run/systemd/resolve','/run/systemd/resolve');
  // Keep installed CLI code read-only while replacing its writable profile.
  if(existsSync(join(hostHome,'.local')))mounts.push('--ro-bind',join(hostHome,'.local'),join(hostHome,'.local'));
  mounts.push('--ro-bind',common,common,'--bind',worktree,worktree,'--ro-bind',join(worktree,'.git'),join(worktree,'.git'),'--chdir',worktree,'--setenv','HOME',hostHome);
  if(dependencies)mounts.push('--ro-bind',realpathSync(dependencies),join(worktree,'node_modules'));
  if(!adapter)mounts.push('--unshare-net');
  return {command:process.env.AGENTD_BWRAP_BIN??'/usr/bin/bwrap',args:[...mounts,'--',executable,...args],cleanup:()=>rmSync(runtime,{recursive:true,force:true})};
  }catch(error){rmSync(runtime,{recursive:true,force:true});throw error;}
}
