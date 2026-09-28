import {cursorCredentialPath,cursorCredentials} from './cursor-policy.ts';
import {mkdirSync,lstatSync,openSync,readFileSync,writeFileSync,fsyncSync,closeSync,renameSync,rmSync,constants} from 'node:fs';
import {join,dirname} from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
export const credentialFile=(id:string)=>{if(id==='cursor')return cursorCredentialPath;if(id==='claude')return '.claude/.credentials.json';if(id==='codex')return '.codex/auth.json';throw Error('Unsupported account');};
export function privateDirectory(path:string){mkdirSync(path,{recursive:true,mode:0o700});const s=lstatSync(path);if(!s.isDirectory()||s.isSymbolicLink())throw Error('Invalid credential directory');for(const p of [path,dirname(path)]){const fd=openSync(p,'r');try{fsyncSync(fd);}finally{closeSync(fd);}}}
export function readCredentials(home:string,id:string){
  const path=join(home,credentialFile(id));let directory=home;for(const part of ['',...credentialFile(id).split('/').slice(0,-1)]){directory=join(directory,part);const s=lstatSync(directory);if(!s.isDirectory()||s.isSymbolicLink())throw Error('Invalid credential directory');}
  const fd=openSync(path,constants.O_RDONLY|constants.O_NOFOLLOW);let raw:string;
  try{const s=lstatSync(path);if(!s.isFile()||s.size>65536)throw Error('Invalid credentials');raw=readFileSync(fd,'utf8');}finally{closeSync(fd);}
  const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid credentials');
  if(id==='cursor')return cursorCredentials(value);
  const token=id==='claude'?value.claudeAiOauth?.accessToken:value.tokens?.access_token;
  if(typeof token!=='string'||!token||value.OPENAI_API_KEY)throw Error('Subscription credentials required');
  return value;
}
export const fingerprint=(value:unknown)=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export function durableJSON(path:string,value:unknown){
  privateDirectory(dirname(path));try{const s=lstatSync(path);if(!s.isFile()||s.isSymbolicLink())throw Error('Invalid credential destination');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  const temporary=path+'.'+randomUUID(),fd=openSync(temporary,'wx',0o600);
  try{writeFileSync(fd,JSON.stringify(value));fsyncSync(fd);}finally{closeSync(fd);}
  try{renameSync(temporary,path);const dir=openSync(dirname(path),'r');try{fsyncSync(dir);}finally{closeSync(dir);}}finally{rmSync(temporary,{force:true});}
}
export function expiresAt(id:string,value:any):number|null{
  if(id==='claude')return Number.isFinite(value.claudeAiOauth?.expiresAt)?value.claudeAiOauth.expiresAt:null;
  try{const exp=JSON.parse(Buffer.from((id==='cursor'?value.accessToken:value.tokens.access_token).split('.')[1],'base64url').toString()).exp;return Number.isFinite(exp)?exp*1000:null;}catch{return null;}
}
export function workerCredentials(id:string,value:any){
  if(id==='cursor')return cursorCredentials(value,false);
  if(id==='claude'){const o=value.claudeAiOauth;return {claudeAiOauth:{accessToken:o.accessToken,expiresAt:o.expiresAt,scopes:o.scopes,subscriptionType:o.subscriptionType,rateLimitTier:o.rateLimitTier}};}
  return {auth_mode:'chatgpt',OPENAI_API_KEY:null,tokens:{id_token:value.tokens.id_token,access_token:value.tokens.access_token,refresh_token:'',account_id:value.tokens.account_id},last_refresh:new Date().toISOString()};
}
