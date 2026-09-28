import {spawn,type ChildProcess} from 'node:child_process';
import {mkdirSync,mkdtempSync,readFileSync,writeFileSync,renameSync,rmSync,existsSync,lstatSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {randomUUID} from 'node:crypto';
import {stripVTControlCharacters} from 'node:util';
import {adapter,probeAccount} from './adapters.ts';

type State='starting'|'waiting'|'verifying'|'succeeded'|'failed'|'cancelled'|'expired';
type View={id:string;adapter:string;action:'login'|'logout';state:State;message:string;url:string|null;code:string|null;needsCode:boolean;expiresAt:string};
type Session={view:View;owner:string;home:string;child?:ChildProcess;buffer:string;timer?:ReturnType<typeof setTimeout>;done:Promise<void>;resolve:()=>void;stopped:boolean;settled:boolean};
type Config={root:string;home?:string;timeoutMs?:number;probe?:typeof probeAccount;command?:(id:string,action:string)=>[string,string[]];changed:()=>void};

// These are native CLI output parsers, never a generic terminal or URL forwarder.
export function loginDetails(id:string,raw:string){
  const text=stripVTControlCharacters(raw);
  let url:string|null=null,code:string|null=null;
  for(const candidate of text.match(/https:\/\/[^\s<>"']+(?=[\s<>"'])/g)??[]){
    try{
      const u=new URL(candidate);
      if(u.username||u.password||u.port||u.hash)continue;
      if(id==='codex'&&u.origin==='https://auth.openai.com'&&u.pathname==='/codex/device'&&!u.search)url=u.href;
      if(id==='claude'&&((['https://claude.ai','https://claude.com'].includes(u.origin)&&u.pathname==='/oauth/authorize')||(u.origin==='https://claude.com'&&u.pathname==='/cai/oauth/authorize'))){
        const redirect=u.searchParams.get('redirect_uri');
        if(u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&!u.hash&&redirect&&['https://console.anthropic.com/oauth/code/callback','https://platform.claude.com/oauth/code/callback'].includes(redirect)&&u.searchParams.get('response_type')==='code'&&u.searchParams.get('code_challenge_method')==='S256'&&u.searchParams.has('state')&&u.searchParams.has('code_challenge'))url=u.href;
      }
    }catch{}
  }
  if(id==='codex')code=text.match(/\b[A-Z0-9]{4,5}-[A-Z0-9]{4,5}\b/)?.[0]??null;
  return {url,code,needsCode:id==='claude'&&!!url&&/paste.*code/i.test(text)};
}

// Reject links, non-regular files, oversized data and non-JSON credential files.
function jsonFile(path:string){
  const stat=lstatSync(path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536)throw Error('Invalid credential file');
  const value=JSON.parse(readFileSync(path,'utf8'));if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid credential file');return value;
}
function directory(path:string){mkdirSync(path,{recursive:true,mode:0o700});if(lstatSync(path).isSymbolicLink()||!lstatSync(path).isDirectory())throw Error('Invalid profile directory');}
export function saveLogin(id:string,source:string,target:string){
  const file=id==='claude'?'.claude/.credentials.json':'.codex/auth.json';
  const credentials=jsonFile(join(source,file));
  if(id==='claude'&&(!credentials.claudeAiOauth?.accessToken||!credentials.claudeAiOauth?.refreshToken))throw Error('Subscription credentials missing');
  if(id==='codex'&&(!credentials.tokens?.access_token||credentials.OPENAI_API_KEY))throw Error('Subscription credentials missing');
  directory(target);directory(join(target,id==='claude'?'.claude':'.codex'));
  // Keep existing settings, but never retain a previous Claude account identity.
  const updates:Array<{path:string;value:unknown}>=[];
  if(id==='claude'){
    const meta=join(target,'.claude.json'),previous=existsSync(meta)?jsonFile(meta):{};
    const fresh=existsSync(join(source,'.claude.json'))?jsonFile(join(source,'.claude.json')):{};
    delete previous.oauthAccount;
    if(fresh.oauthAccount)previous.oauthAccount=fresh.oauthAccount;
    updates.push({path:meta,value:previous});
  }
  updates.push({path:join(target,file),value:credentials});
  const prepared=updates.map(update=>{
    let previous:Buffer|null=null;
    if(existsSync(update.path)){const stat=lstatSync(update.path);if(!stat.isFile()||stat.isSymbolicLink()||stat.size>65536)throw Error('Invalid credential file');previous=readFileSync(update.path);}
    return {...update,previous,temp:update.path+'.'+randomUUID()};
  });
  const published:typeof prepared=[];
  try{
    for(const item of prepared)writeFileSync(item.temp,JSON.stringify(item.value),{flag:'wx',mode:0o600});
    for(const item of prepared){renameSync(item.temp,item.path);published.push(item);}
  }catch(error){
    for(const item of published.reverse()){if(item.previous){writeFileSync(item.temp,item.previous,{mode:0o600});renameSync(item.temp,item.path);}else rmSync(item.path,{force:true});}
    throw error;
  }finally{for(const item of prepared)rmSync(item.temp,{force:true});}
}

export function accounts(c:Config){
  directory(c.root);
  for(const name of readdirSync(c.root))if(name.startsWith('login-'))rmSync(join(c.root,name),{recursive:true,force:true});
  const home=c.home??homedir();let current:Session|undefined,closed=false;
  const busy=()=>!!current&&!current.settled;
  const view=(owner:string)=>current?.owner===owner?{...current.view}:null;
  const lookup=(owner:string,id:string)=>{if(!current||current.owner!==owner||current.view.id!==id)throw Error('Sign-in session not found. Start again.');return current;};
  const signal=(s:Session)=>{if(s.child?.pid)try{process.kill(-s.child.pid,'SIGKILL');}catch{}};
  const finish=(s:Session,state:State,message:string)=>{
    if(s.timer)clearTimeout(s.timer);signal(s);s.buffer='';s.view={...s.view,state,message,url:null,code:null,needsCode:false};
    if(s.view.action==='login')rmSync(s.home,{recursive:true,force:true});s.settled=true;s.resolve();c.changed();
  };
  function start(owner:string,id:string,action:'login'|'logout'){
    adapter(id);if(closed||busy())throw Error('Another account change is in progress.');
    if(!/^[a-f0-9]{64}$/.test(owner))throw Error('Authenticated browser session required');
    const sessionHome=action==='login'?mkdtempSync(join(c.root,'login-')):home;
    if(action==='login')directory(join(sessionHome,id==='codex'?'.codex':'.claude'));
    let resolve!:()=>void;const done=new Promise<void>(r=>resolve=r);
    const s:Session={owner,home:sessionHome,buffer:'',done,resolve,stopped:false,settled:false,view:{id:randomUUID(),adapter:id,action,state:'starting',message:action==='login'?'Preparing secure sign-in…':'Signing out…',url:null,code:null,needsCode:false,expiresAt:new Date(Date.now()+(c.timeoutMs??600000)).toISOString()}};current=s;
    const args=id==='codex'?['-c','forced_login_method="chatgpt"','-c','cli_auth_credentials_store="file"',...(action==='login'?['login','--device-auth']:['logout'])]:['auth',action,...(action==='login'?['--claudeai']:[])];
    const [command,commandArgs]=c.command?.(id,action)??[adapter(id).executable(),args];
    const env={HOME:sessionHome,CODEX_HOME:join(sessionHome,'.codex'),PATH:process.env.PATH??'/usr/local/bin:/usr/bin:/bin',LANG:'C.UTF-8',TERM:'dumb',BROWSER:'/usr/bin/true',DISABLE_AUTOUPDATER:'1',DISABLE_TELEMETRY:'1',DISABLE_ERROR_REPORTING:'1'};
    try{
      s.child=spawn(command,commandArgs,{cwd:sessionHome,env,detached:true,stdio:['pipe','pipe','pipe']});
      s.child.stdin?.on('error',()=>{});
      const stop=(state:State,message:string)=>{s.stopped=true;s.view={...s.view,state,message,url:null,code:null,needsCode:false};signal(s);};
      s.timer=setTimeout(()=>stop('expired','Sign-in timed out. Start again.'),action==='logout'?Math.min(c.timeoutMs??10000,10000):c.timeoutMs??600000);s.timer.unref();
      const output=(chunk:Buffer)=>{
        if(s.stopped)return;s.buffer+=chunk.toString('utf8');
        if(s.buffer.length>32768){stop('failed','The sign-in tool returned unexpected output. Try again.');return;}
        if(action==='login'){
          const details=loginDetails(id,s.buffer);
          if(details.url){s.view={...s.view,...details,state:'waiting',message:id==='codex'?'Open OpenAI, enter the one-time code, and approve sign-in.':'Open Claude and approve sign-in. Paste the returned code below if requested.'};}
        }
      };
      s.child.stdout?.on('data',output);s.child.stderr?.on('data',output);
      s.child.on('error',()=>{s.stopped=true;s.view.state='failed';s.view.message='The sign-in tool could not start. Check that the agent is installed.';});
      s.child.on('close',async code=>{
        if(s.timer)clearTimeout(s.timer);signal(s);s.child=undefined;
        if(s.stopped){finish(s,s.view.state,s.view.message);return;}
        s.view={...s.view,state:'verifying',message:'Verifying account status…',url:null,code:null,needsCode:false};s.buffer='';
        try{
          if(code!==0)throw Error('Native command failed');
          const status=await (c.probe??probeAccount)(id,s.home);
          if(s.stopped){finish(s,'cancelled','Account change cancelled.');return;}
          if(action==='login'){
            if(status.state!=='signed_in'||!status.method?.includes('subscription'))throw Error('Sign-in not verified');
            saveLogin(id,s.home,home);
          }else if(status.state!=='signed_out')throw Error('Sign-out not verified');
          finish(s,'succeeded',action==='login'?'Signed in successfully. You can return to your project.':'Signed out on this server.');
        }catch{finish(s,'failed',action==='login'?'Sign-in could not be verified. Your previous login was kept. Retry; for Codex, device-code login must be enabled in your ChatGPT settings.':'Sign-out could not be verified. Refresh account status before trying again.');}
      });
    }catch{finish(s,'failed','The sign-in tool could not start.');}
    return view(owner);
  }
  function cancel(owner:string,id:string){
    const s=lookup(owner,id);if(!s.settled){s.stopped=true;s.view={...s.view,state:'cancelled',message:'Sign-in cancelled.',url:null,code:null,needsCode:false};signal(s);}return view(owner);
  }
  function submit(owner:string,id:string,code:unknown){
    const s=lookup(owner,id);
    if(s.view.adapter!=='claude'||s.view.state!=='waiting'||!s.view.needsCode||s.stopped)throw Error('This sign-in is not waiting for a code.');
    if(typeof code!=='string'||!/^[A-Za-z0-9_#.-]{8,4096}$/.test(code))throw Error('Paste the code from Claude, without spaces or a URL.');
    s.view.needsCode=false;s.view.state='verifying';s.view.message='Verifying sign-in…';s.buffer='';s.child?.stdin?.write(code+'\n');return view(owner);
  }
  return {busy,view,start,cancel,submit,async close(){closed=true;if(current&&!current.settled){cancel(current.owner,current.view.id);await current.done;}}};
}
