import {existsSync,mkdirSync,rmSync,readFileSync,lstatSync} from 'node:fs';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {adapter} from './adapters.ts';
import {isolated} from './isolation.ts';
import {credentialFile,readCredentials,privateDirectory,durableJSON,fingerprint,expiresAt} from './credentials.ts';
const margin=20*60*1000;
export const renewalFailure='Account renewal could not finish. Open Operations and reconnect the account, then retry this run.';
type View={state:'ready'|'renewing'|'reconnect_required'|'unavailable';message:string;expiresAt:string|null};
type Config={home?:string;root?:string;stateDir:string;changed?:()=>void;renew?:(id:string,profile:string,signal:AbortSignal)=>Promise<void>};
// This store is outside task state/backups. A rollback must never resurrect a rotated token.
export function renewals(c:Config){
  const home=c.home??homedir(),root=c.root??join(home,'.agentd-renewal');privateDirectory(root);
  let running:Promise<void>|undefined,abort:AbortController|undefined,closed=false;
  const views=new Map<string,View>();
  const paths=(id:string)=>{credentialFile(id);const base=join(root,id);return {base,profile:join(base,'profile'),journal:join(base,'journal.json')};};
  const renewable=(id:string,v:any)=>{const grant=id==='claude'?v.claudeAiOauth?.refreshToken:v.tokens?.refresh_token;if(typeof grant!=='string'||!grant)throw Error(renewalFailure);return v;};
  const healthy=(id:string,v:any)=>{const expiry=expiresAt(id,v);return expiry!==null&&expiry>Date.now()+margin;};
  function recover(id:string){
    const p=paths(id);if(!existsSync(p.journal))return;privateDirectory(p.base);privateDirectory(p.profile);
    if(lstatSync(p.journal).isSymbolicLink()||lstatSync(p.journal).size>4096)throw Error(renewalFailure);
    const journal=JSON.parse(readFileSync(p.journal,'utf8'));
    let current:any;try{current=readCredentials(home,id);}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw Error(renewalFailure);rmSync(p.base,{recursive:true,force:true});return;}
    // A GUI reconnect or sign-out supersedes an older renewal; never undo it.
    if(fingerprint(current)!==journal.base){rmSync(p.base,{recursive:true,force:true});return;}
    const candidate=renewable(id,readCredentials(p.profile,id));
    if((fingerprint(candidate)!==journal.base&&healthy(id,candidate))||journal.verified===fingerprint(candidate)){
      durableJSON(join(home,credentialFile(id)),candidate);rmSync(p.base,{recursive:true,force:true});return;
    }
    // Interrupted exchange with no safely saved replacement is ambiguous. Do not replay it.
    throw Error(renewalFailure);
  }
  for(const id of ['claude','codex'])try{recover(id);}catch{views.set(id,{state:'reconnect_required',message:renewalFailure,expiresAt:null});}
  function view(id:string):View{
    if(views.get(id)?.state==='renewing')return {...views.get(id)!};
    try{
      const p=paths(id);if(existsSync(p.journal))return {state:'reconnect_required',message:renewalFailure,expiresAt:null};
      const v=readCredentials(home,id),expiry=expiresAt(id,v);
      return {state:'ready',message:healthy(id,v)?'Session ready. Renewal is automatic before work.':'Session will be renewed before the next approved run.',expiresAt:expiry===null?null:new Date(expiry).toISOString()};
    }catch{return {state:'unavailable',message:'Sign in to enable automatic renewal.',expiresAt:null};}
  }
  async function exchange(id:string,profile:string,signal:AbortSignal){
    const empty=join(profile,'empty');mkdirSync(empty,{recursive:true,mode:0o700});
    const box=isolated(empty,c.stateDir,process.execPath,[fileURLToPath(new URL('./native-renewal.ts',import.meta.url)),adapter(id).executable(),id],id,undefined,false,false,{renewalHome:profile});
    try{await new Promise<void>((resolve,reject)=>{
      const child=spawn(box.command,box.args,{cwd:empty,env:{HOME:home,PATH:process.env.PATH,LANG:'C.UTF-8',TERM:'dumb'},detached:true,stdio:['ignore','pipe','ignore']});let output='';
      const kill=()=>{if(child.pid)try{process.kill(-child.pid,'SIGKILL');}catch{}};
      signal.addEventListener('abort',kill,{once:true});if(signal.aborted)kill();const timer=setTimeout(kill,60000);
      child.stdout.on('data',v=>{output+=v.toString();if(output.length>128)kill();});child.on('error',()=>{});
      child.on('close',code=>{clearTimeout(timer);signal.removeEventListener('abort',kill);kill();if(code===0&&output.trim()==='RENEWAL_OK'&&!signal.aborted)resolve();else reject(Error(renewalFailure));});
    });}finally{box.cleanup();}
  }
  async function ensure(id:string,force=false){
    if(closed||running)throw Error('Account renewal is busy');
    credentialFile(id);abort=new AbortController();const signal=abort.signal;
    running=Promise.resolve().then(async()=>{
      try{
        recover(id);const value=renewable(id,readCredentials(home,id));if(!force&&healthy(id,value))return;
        const p=paths(id);privateDirectory(p.base);privateDirectory(p.profile);durableJSON(join(p.profile,credentialFile(id)),value);
        // Do not import hooks, plugins, MCP configuration, project memory or API helpers.
        if(id==='claude')durableJSON(join(p.profile,'.claude.json'),{hasCompletedOnboarding:true});
        const base=fingerprint(value);durableJSON(p.journal,{base});
        views.set(id,{state:'renewing',message:'Renewing the account securely before work starts…',expiresAt:null});c.changed?.();
        let error:unknown;try{await (c.renew??exchange)(id,p.profile,signal);const candidate=renewable(id,readCredentials(p.profile,id));if(id==='claude'&&!healthy(id,candidate))throw Error(renewalFailure);const expiry=expiresAt(id,candidate);if(expiry!==null&&!healthy(id,candidate))throw Error(renewalFailure);durableJSON(p.journal,{base,verified:fingerprint(candidate)});}catch(e){error=e;}
        // Native code may rotate credentials before reporting another error. Preserve that rotation.
        recover(id);
        if(error||signal.aborted)throw Error(renewalFailure);
      }catch{throw Error(renewalFailure);}
    });
    try{await running;}finally{running=undefined;abort=undefined;views.delete(id);c.changed?.();}
  }
  return {ensure,view,reconcile(){if(!running)for(const id of ['claude','codex'])try{recover(id);}catch{}},busy:()=>!!running,async close(){closed=true;abort?.abort();try{await running;}catch{}}};
}
