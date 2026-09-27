import {existsSync,copyFileSync,mkdirSync,rmSync,mkdtempSync,realpathSync} from 'node:fs';
import {join,resolve,dirname} from 'node:path';
import {homedir} from 'node:os';
import {spawn,type ChildProcess} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {git} from './changes.ts';

// Explicit mounts only: unrelated projects, daemon state, sockets and profiles are absent.
export function isolated(worktree:string,stateDir:string,command:string,args:string[],adapter?:string,dependencies?:string,writable=true){
  if(process.platform!=='linux')throw Error('Worker isolation requires Linux with bubblewrap');
  if(adapter&&!['claude','codex'].includes(adapter))throw Error('Unsupported adapter');
  const runtime=mkdtempSync(join(stateDir,'worker-')),home=join(runtime,'home');mkdirSync(home,{mode:0o700});
  let broker:ChildProcess|undefined;
  const cleanup=()=>{broker?.kill('SIGTERM');rmSync(runtime,{recursive:true,force:true});};
  try{
    const hostHome=homedir();
    if(adapter){
      // Only the selected CLI's login is copied; no other provider or Git credentials.
      const files=adapter==='codex'?['.codex/auth.json']:['.claude.json','.claude/.credentials.json'];
      for(const file of files){const source=join(hostHome,file);if(existsSync(source)){mkdirSync(dirname(join(home,file)),{recursive:true,mode:0o700});copyFileSync(source,join(home,file));}}
    }
    const common=realpathSync(resolve(worktree,git(worktree,['rev-parse','--git-common-dir'])));
    const executable=realpathSync(command),node=realpathSync(process.execPath),source=dirname(fileURLToPath(import.meta.url));
    const mounts=['--die-with-parent','--new-session','--unshare-pid','--unshare-ipc','--unshare-net','--proc','/proc','--dev','/dev','--tmpfs','/tmp','--dir','/run'];
    // System runtime only. Never bind the host root, /home, /srv or /var wholesale.
    for(const path of ['/usr','/bin','/sbin','/lib','/lib64'])if(existsSync(path))mounts.push('--ro-bind',path,path);
    for(const path of ['/etc/ssl/certs','/etc/ca-certificates','/etc/ld.so.cache','/etc/nsswitch.conf','/etc/passwd','/etc/group','/etc/hosts','/etc/localtime'])if(existsSync(path))mounts.push('--ro-bind',realpathSync(path),path);
    if(!node.startsWith('/usr/')){const prefix=dirname(dirname(node));mounts.push('--ro-bind',prefix,prefix);}
    // Pin the child entry/check code to this application, never a repository-supplied path.
    mounts.push('--bind',home,hostHome,'--ro-bind',source,source);
    if(adapter&&!executable.startsWith('/usr/')){
      const modules=executable.indexOf('/node_modules/');
      const install=modules<0?executable:executable.slice(0,modules+14)+executable.slice(modules+14).split('/')[0];
      mounts.push('--ro-bind',install,install);
    }
    mounts.push('--ro-bind',common,common,writable?'--bind':'--ro-bind',worktree,worktree,'--ro-bind',join(worktree,'.git'),join(worktree,'.git'),'--chdir',worktree,'--setenv','HOME',hostHome);
    if(dependencies)mounts.push('--ro-bind',realpathSync(dependencies),join(worktree,'node_modules'));
    let childCommand=executable,childArgs=args;
    if(adapter){
      const network=join(runtime,'network');mkdirSync(network,{mode:0o700});const socket=join(network,'egress.sock');
      // Separate host process: DNS and outbound connections happen outside the worker namespace.
      broker=spawn(node,[join(source,'egress-proxy.ts'),socket,adapter,String(process.pid)],{env:{PATH:'/usr/local/bin:/usr/bin:/bin'},stdio:'ignore'});
      broker.on('error',()=>{});
      mounts.push('--ro-bind',network,'/run/agentd-egress');
      childCommand=node;childArgs=[join(source,'worker-entry.ts'),'/run/agentd-egress/egress.sock',executable,...args];
    }
    return {command:process.env.AGENTD_BWRAP_BIN??'/usr/bin/bwrap',args:[...mounts,'--',childCommand,...childArgs],cleanup};
  }catch(error){cleanup();throw error;}
}
