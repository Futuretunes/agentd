import {readCredentials} from './credentials.ts';
import {accessSync,constants,statSync} from 'node:fs';
import {homedir} from 'node:os';
import {join,isAbsolute} from 'node:path';
import {execFile} from 'node:child_process';
import {fileURLToPath} from 'node:url';

export type Mode='ask'|'edit'|'chat';
export type Invocation={prompt:string;mode:Mode;images:readonly string[]};
export type Adapter={
  id:string;name:string;images:boolean;
  executable:()=>string;
  arguments:(input:Invocation)=>string[];
};
export type AccountStatus={state:'signed_in'|'signed_out'|'checking'|'error'|'unavailable';method:string|null;checkedAt:string|null;message:string};
// Trusted application code only: repositories cannot install adapters or supply shell commands.
const registry:readonly Adapter[]=[
  {id:'cursor',name:'Cursor',images:false,executable:()=>process.env.AGENTD_CURSOR_BIN??join(homedir(),'.local/bin/cursor-agent'),arguments:()=>{throw Error('Cursor requires the ACP wrapper');}},
  {id:'codex',name:'Codex',images:true,
    executable:()=>process.env.AGENTD_CODEX_BIN??join(homedir(),'.local/bin/codex'),
    arguments:({prompt,mode,images})=>['-c','forced_login_method="chatgpt"','exec','--sandbox',mode==='edit'?'workspace-write':'read-only','--ephemeral',...images.flatMap(path=>['--image',path]),prompt]},
  {id:'claude',name:'Claude',images:true,
    executable:()=>process.env.AGENTD_CLAUDE_BIN??join(homedir(),'.local/bin/claude'),
    arguments:({prompt,mode})=>{const tools=mode==='edit'?'Read,Glob,Grep,Edit,Write':'Read,Glob,Grep';return ['-p','--permission-mode','dontAsk','--tools',tools,'--allowedTools',tools,'--max-turns','16',prompt];}},
];
export const adapterIds=registry.map(adapter=>adapter.id);
export function adapter(id:string){const value=registry.find(value=>value.id===id);if(!value)throw Error('Unsupported adapter');return value;}
export function invocation(id:string,input:Invocation):[string,string[]]{
  if(input.mode==='chat'){
    if(id!=='codex'||input.images.length)throw Error('Chat only supports Codex text prompts');
    return [process.execPath,[fileURLToPath(new URL('./codex-chat.ts',import.meta.url)),adapter(id).executable(),input.prompt]];
  }
  if(id==='cursor'&&['ask','edit'].includes(input.mode)){if(input.images.length)throw Error('Cursor currently accepts text only');return [process.execPath,[fileURLToPath(new URL('./cursor-acp.ts',import.meta.url)),adapter(id).executable(),input.mode,input.prompt]];}
  if(!['ask','edit'].includes(input.mode))throw Error('Unsupported work mode');
  const value=adapter(id);if(input.images.length&&!value.images)throw Error('This adapter does not support images');
  return [value.executable(),value.arguments(input)];
}
function installed(path:string){try{return isAbsolute(path)&&statSync(path).isFile()&&(accessSync(path,constants.X_OK),true);}catch{return false;}}
export function discover(enabled:readonly string[],editing:readonly string[],customCommand=false,chatOnly=false){
  return registry.map(value=>{
    const present=customCommand||installed(value.executable()),chat=value.id==='codex'&&chatOnly,permitted=enabled.includes(value.id)||chat;
    const available=present&&permitted;
    return {id:value.id,name:value.name,installed:present,enabled:permitted,available,
      reason:!permitted?'Adapter disabled by security policy':!present?'CLI is missing or not executable':null,
      modes:available?(chat?['chat']:editing.includes(value.id)?['ask','edit']:['ask']):[],
      features:{images:!chat&&value.images},authentication:'not_checked'};
  });
}

export function probeAccount(id:string,home=homedir()):Promise<AccountStatus>{
  const value=adapter(id),executable=value.executable(),args=id==='cursor'?['status','--format','json']:id==='codex'?['login','status']:['auth','status','--text'];
  if(!installed(executable))return Promise.resolve({state:'unavailable',method:null,checkedAt:new Date().toISOString(),message:'CLI is missing or not executable'});
  return new Promise(resolve=>execFile(executable,args,{cwd:home,timeout:10000,killSignal:'SIGKILL',maxBuffer:4096,env:{HOME:home,CODEX_HOME:join(home,'.codex'),PATH:process.env.PATH??'/usr/local/bin:/usr/bin:/bin',LANG:'C.UTF-8',TERM:'dumb',AGENT_CLI_CREDENTIAL_STORE:'file',NO_OPEN_BROWSER:'1',DIRENV_DISABLE:'1',DISABLE_AUTOUPDATER:'1',DISABLE_TELEMETRY:'1',DISABLE_ERROR_REPORTING:'1'}},(error,stdout,stderr)=>{
    const output=String(stdout)+String(stderr),checkedAt=new Date().toISOString();
    if(id==='cursor'){try{const value=JSON.parse(stdout);if(value.status==='unauthenticated'){resolve({state:'signed_out',method:null,checkedAt,message:'Sign-in required'});return;}readCredentials(home,id);if(!error&&value.status==='authenticated'&&value.isAuthenticated&&value.userInfo){resolve({state:'signed_in',method:'Cursor account',checkedAt,message:'Native browser account is signed in'});return;}}catch{}resolve({state:'error',method:null,checkedAt,message:'Could not verify Cursor account. Reconnect in Operations.'});return;}
    if(/not logged in|not authenticated|login required/i.test(output))resolve({state:'signed_out',method:null,checkedAt,message:'Sign-in required'});
    else if(!error&&(/logged in/i.test(output)||/login method:/i.test(output)))resolve({state:'signed_in',method:id==='codex'&&/chatgpt/i.test(output)?'ChatGPT subscription':id==='claude'&&/login method:\s*Claude (?:Pro|Max|Team|Enterprise|subscription|account)/i.test(output)?'Claude subscription':'Native account',checkedAt,message:'Account is signed in'});
    else resolve({state:'error',method:null,checkedAt,message:error?.killed?'Status check timed out':'Could not verify sign-in'});
  }));
}
