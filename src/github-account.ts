import {spawn} from 'node:child_process';
import {existsSync,mkdirSync,mkdtempSync,rmSync,renameSync,lstatSync,readdirSync,chmodSync,openSync,fsyncSync,closeSync} from 'node:fs';
import {join} from 'node:path';import {randomUUID} from 'node:crypto';
export function githubAccount(root:string,executable='/usr/local/bin/gh'){
 if(existsSync(root)&&lstatSync(root).isSymbolicLink())throw Error('Invalid GitHub profile directory');
 const profile=join(root,'profile');if(existsSync(join(root,'previous'))&&!existsSync(profile))renameSync(join(root,'previous'),profile);for(const name of existsSync(root)?readdirSync(root):[])if(name.startsWith('login-'))rmSync(join(root,name),{recursive:true,force:true});
 let current:any=null,closed=false;
 if(existsSync(profile))rmSync(join(root,'previous'),{recursive:true,force:true});
 const connected=()=>{try{return lstatSync(profile).isDirectory()&&!lstatSync(profile).isSymbolicLink()&&lstatSync(join(profile,'hosts.yml')).isFile()&&!lstatSync(join(profile,'hosts.yml')).isSymbolicLink();}catch{return false;}};
 const busy=()=>!!current&&!current.done;
 const view=(owner:string)=>({installed:existsSync(executable),connected:connected(),busy:busy(),session:current?.owner===owner?{id:current.id,state:current.state,code:current.code,url:current.code?'https://github.com/login/device':null,message:current.message}:null});
 function start(owner:string){
  if(closed||busy())throw Error('A GitHub connection is already in progress.');if(!/^[a-f0-9]{64}$/.test(owner))throw Error('Authenticated browser session required');if(!existsSync(executable))throw Error('GitHub CLI is not installed.');
  mkdirSync(root,{recursive:true,mode:0o700});
  const temporary=mkdtempSync(join(root,'login-')),home=join(temporary,'home'),config=join(temporary,'config');mkdirSync(home);mkdirSync(config);
  let resolve!:()=>void;const finished=new Promise<void>(r=>resolve=r);const session={id:randomUUID(),owner,state:'starting',code:null as string|null,message:'Preparing GitHub sign-in…',done:false,stopped:false,finished,stop:()=>{}};current=session;
  const child=spawn(executable,['auth','login','--hostname','github.com','--git-protocol','https','--web','--skip-ssh-key'],{cwd:home,env:{HOME:home,GH_CONFIG_DIR:config,GH_HOST:'github.com',GH_PROMPT_DISABLED:'1',BROWSER:'/usr/bin/true',GH_BROWSER:'/usr/bin/true',PATH:'/usr/local/bin:/usr/bin:/bin'},detached:true,stdio:['ignore','pipe','pipe']});let output='';
  session.stop=()=>{session.stopped=true;if(child.pid)try{process.kill(-child.pid,'SIGKILL');}catch{}};const timer=setTimeout(session.stop,600000);
  const capture=(v:Buffer)=>{output+=v.toString();if(output.length>32768){session.stop();return;}const code=output.match(/\b[A-Z0-9]{4}-[A-Z0-9]{4}\b/)?.[0];if(code){session.code=code;session.state='waiting';session.message='Open GitHub, enter this one-time code and review the requested permissions.';}};
  child.stdout.on('data',capture);child.stderr.on('data',capture);child.on('error',()=>{});
  child.on('close',code=>{clearTimeout(timer);if(child.pid)try{process.kill(-child.pid,'SIGKILL');}catch{};session.code=null;output='';
   try{
    if(code!==0||session.stopped)throw Error();const file=join(config,'hosts.yml'),stat=lstatSync(file);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536||stat.size===0)throw Error();
    for(const name of readdirSync(config)){const path=join(config,name);if(!lstatSync(path).isFile()||lstatSync(path).isSymbolicLink())throw Error();chmodSync(path,0o600);const fd=openSync(path,'r');try{fsyncSync(fd);}finally{closeSync(fd);}}
    chmodSync(config,0o700);const old=join(root,'previous');rmSync(old,{recursive:true,force:true});if(existsSync(profile))renameSync(profile,old);
    try{renameSync(config,profile);}catch(e){if(existsSync(old))renameSync(old,profile);throw e;}rmSync(old,{recursive:true,force:true});const fd=openSync(root,'r');try{fsyncSync(fd);}finally{closeSync(fd);}
    session.state='succeeded';session.message='GitHub connected. Private imports use this server account.';
   }catch{session.state=session.stopped?'cancelled':'failed';session.message='GitHub sign-in did not finish. Your previous connection was kept.';}
   session.done=true;rmSync(temporary,{recursive:true,force:true});resolve();
  });return view(owner);
 }
 return {busy,view,profile:()=>connected()?profile:undefined,start,cancel(owner:string,id:string){if(current?.owner!==owner||current.id!==id)throw Error('Connection session not found');current.stop();return view(owner);},logout(){if(busy())throw Error('Finish GitHub sign-in first.');rmSync(join(root,'previous'),{recursive:true,force:true});rmSync(profile,{recursive:true,force:true});current=null;return {ok:true};},async close(){closed=true;if(busy()){current.stop();await current.finished;}}};
}
