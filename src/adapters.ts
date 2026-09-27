import {accessSync,constants,statSync} from 'node:fs';
import {homedir} from 'node:os';
import {join,isAbsolute} from 'node:path';

export type Mode='ask'|'edit';
export type Invocation={prompt:string;mode:Mode;images:readonly string[]};
export type Adapter={
  id:string;name:string;images:boolean;
  executable:()=>string;
  arguments:(input:Invocation)=>string[];
};
// Trusted application code only: repositories cannot install adapters or supply shell commands.
const registry:readonly Adapter[]=[
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
  if(!['ask','edit'].includes(input.mode))throw Error('Unsupported work mode');
  const value=adapter(id);if(input.images.length&&!value.images)throw Error('This adapter does not support images');
  return [value.executable(),value.arguments(input)];
}
function installed(path:string){try{return isAbsolute(path)&&statSync(path).isFile()&&(accessSync(path,constants.X_OK),true);}catch{return false;}}
export function discover(enabled:readonly string[],editing:readonly string[],customCommand=false){
  return registry.map(value=>{
    const present=customCommand||installed(value.executable()),permitted=enabled.includes(value.id);
    const available=present&&permitted;
    return {id:value.id,name:value.name,installed:present,enabled:permitted,available,
      reason:!permitted?'Adapter disabled by security policy':!present?'CLI is missing or not executable':null,
      modes:available?(editing.includes(value.id)?['ask','edit']:['ask']):[],
      features:{images:value.images},authentication:'not_checked'};
  });
}
