import {nativeLimits} from './native-policy.ts';
import {createHash} from 'node:crypto';
export type Settings={access?:'blocked'|'chat'|'read'|'edit';model?:string;effort?:string;timeoutSeconds?:number;context?:'previous_answer'|'none'};
export type Model={id:string;name:string;efforts:string[];tier?:'light'|'balanced'|'deep'};
export type Catalog={models:Model[];source:string;checkedAt:string|null;error?:string|null};
export const agents=['claude','codex','cursor'];
export const efforts=['none','low','medium','high','xhigh','max','ultra'];
export function settings(value:unknown,agent='*',next=false):Settings{
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Invalid settings');const out:Settings={};
 for(const [key,v] of Object.entries(value)){
  if(!['access','model','effort','timeoutSeconds','context'].includes(key)||(next&&key==='access'))throw Error('Unsupported setting');
  if(v===null)continue;
  if(key==='access'){if(!['blocked','chat','read','edit'].includes(String(v)))throw Error('Invalid access profile');out.access=v as Settings['access'];}
  if(key==='model'){if(typeof v!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,99}$/.test(v)||(agent==='*'&&!['auto','provider'].includes(v)))throw Error('Choose a listed model for a specific agent');out.model=v;}
  if(key==='effort'){if(typeof v!=='string'||!['auto','provider',...efforts].includes(v)||(agent==='*'&&!['auto','provider'].includes(v)))throw Error('Choose supported effort for a specific agent');out.effort=v;}
  if(key==='context'){if(v!=='previous_answer'&&v!=='none')throw Error('Choose previous saved answer or no previous context');out.context=v;}
  if(key==='timeoutSeconds'){if(!Number.isInteger(v)||Number(v)<30||Number(v)>600)throw Error('Run limit must be 30–600 seconds');out.timeoutSeconds=Number(v);}
 }return out;
}
export function resolveSettings(layers:Array<{source:string;values:Settings}>,agent:string,mode:string,prompt:string,catalog:Catalog,maxMs=600000){
 if(!agents.includes(agent)||!['ask','edit','chat'].includes(mode))throw Error('Unsupported agent or mode');
 const values:Settings={access:'edit',model:'provider',effort:'provider',context:'previous_answer',timeoutSeconds:mode==='edit'?600:120},sources:Record<string,string>={access:'Installation',model:'Installation',effort:'Installation',context:'Installation',timeoutSeconds:'Installation'};
 for(const layer of layers)for(const [k,v] of Object.entries(layer.values)){(values as any)[k]=v;sources[k]=layer.source;}
 const allowed=values.access==='edit'?['ask','edit','chat']:values.access==='read'?['ask','chat']:values.access==='chat'?['chat']:[];
 if(!allowed.includes(mode))throw Error('This run is blocked by the effective access profile. Change settings or start a compatible run.');
 const complex=/\b(architect(?:ure)?|security|auth(?:entication|orization)?|migration|race|deadlock|cryptograph|multi[- ](?:file|service)|production incident)\b/i.test(prompt)||prompt.length>3000;
 const light=!complex&&prompt.length<500&&/\b(summar(?:ize|ise|y)|explain|readme|typo|spelling|rename|translate|format|documentation)\b/i.test(prompt);
 const tier=complex?'deep':light?'light':'balanced';
 let model=values.model!,effort=values.effort!,reason='Manual model selection. Account availability is checked by the native provider when the run starts.';
 if(model==='auto'){
  const choice=catalog.models.find(m=>m.tier===tier)??catalog.models.find(m=>m.tier==='balanced');model=choice?.id??'provider';
  reason=choice?(complex?'Complexity or security indicators; use the stronger approved tier.':light?'Short, scoped request; use the lighter approved tier.':'General task; use the balanced approved tier.'):'No verified routing tier is available; leave model selection to the provider.';
 }else if(model==='provider')reason='Native provider default. agentd does not choose or verify the actual model.';
 const selected=catalog.models.find(m=>m.id===model);
 if(model!=='provider'&&!selected)throw Error('Selected model is no longer in the native catalog. Refresh models and choose again; no fallback was applied.');
 if(effort==='auto'){const wanted=complex?'high':light?'low':'medium';effort=selected?.efforts.includes(wanted)?wanted:selected?.efforts.includes('medium')?'medium':'provider';}
 if(effort!=='provider'&&!selected?.efforts.includes(effort))throw Error('The selected model does not advertise that effort. Choose a supported effort or Provider default.');
 const timeoutMs=Math.min(values.timeoutSeconds!*1000,maxMs);
 const payload={version:1,adapter:agent,mode,nativeLimits:nativeLimits(agent),settings:values,sources,permissions:{filesystem:mode==='chat'?'No project files':mode==='edit'?'Writable isolated worktree':'Read-only isolated worktree',tools:mode==='chat'?'None':mode==='edit'?'Read and edit files':'Read files',network:'Selected provider only',shell:false,mcp:false,hostPaths:false},selection:{model,effort,reason,actualModel:'Unknown / provider-managed',actualEffort:'Unknown / provider-managed',catalogSource:catalog.source},timeoutMs};
 return {...payload,fingerprint:createHash('sha256').update(JSON.stringify(payload)).digest('hex')};
}
export type Execution=ReturnType<typeof resolveSettings>;
