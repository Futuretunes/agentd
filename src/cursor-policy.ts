import {join,resolve,relative,isAbsolute} from 'node:path';
import {readFileSync,lstatSync} from 'node:fs';
export const cursorVersion='2026.09.26-dd393fe';
export const cursorCredentialPath=process.platform==='darwin'?'.cursor/auth.json':'.config/cursor/auth.json';
export function cursorCredentials(value:any,refresh=true){
 if(!value||typeof value.accessToken!=='string'||!value.accessToken||value.accessToken.length>20000||value.apiKey||value.bedrockCredentials||(refresh&&(typeof value.refreshToken!=='string'||!value.refreshToken||value.refreshToken.length>20000)))throw Error('Cursor browser credentials required');
 return {accessToken:value.accessToken,...(refresh?{refreshToken:value.refreshToken}:{})};
}
export function cursorTeam(home:string){try{const p=join(home,'.cursor/cli-config.json'),s=lstatSync(p);if(!s.isFile()||s.isSymbolicLink()||s.size>65536)throw Error();const id=JSON.parse(readFileSync(p,'utf8')).authInfo?.activeTeamId;return Number.isSafeInteger(id)&&id>0?id:undefined;}catch{return undefined;}}
export function cursorSettings(team?:number){return {version:1,approvalMode:'allowlist',permissions:{allow:[],deny:['Shell(*)','Mcp(*:*)','WebFetch(*)','WebSearch(*)']},autoAcceptWebSearch:false,sandbox:{mode:'enabled',networkAccess:'user_config_only'},network:{useHttp1ForAgent:true},...(team?{authInfo:{activeTeamId:team}}:{})};}
// Only explicit file diffs within the approved worktree may receive allow-once.
// Shell, deletion without a structured path, MCP, web, subagents and unknown requests fail closed.
export function cursorPermission(params:any,mode:string,root:string,sessionId:string){
 const reject={outcome:{outcome:'cancelled'}};
 if(!sessionId||params?.sessionId!==sessionId||mode!=='edit'||params.toolCall?.kind!=='edit')return reject;
 const content=params.toolCall.content;if(!Array.isArray(content)||!content.length||content.some(c=>!c||c.type!=='diff'||typeof c.path!=='string'||typeof c.newText!=='string'))return reject;
 for(const c of content){const path=resolve(root,c.path),rel=relative(root,path);if(!rel||isAbsolute(rel)||rel==='..'||rel.startsWith('../')||rel.split(/[\\/]/).some(p=>['.git','.cursor','.claude','.agentd-input','.mcp.json','.envrc'].includes(p)))return reject;
  let parent=path;for(;;){try{if(lstatSync(parent).isSymbolicLink())return reject;}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')return reject;}if(parent===root)break;const next=resolve(parent,'..');if(next===parent)return reject;parent=next;}
 }
 const option=Array.isArray(params.options)&&params.options.find((o:any)=>o?.kind==='allow_once'&&o.optionId==='allow-once');return option?{outcome:{outcome:'selected',optionId:option.optionId}}:reject;
}
