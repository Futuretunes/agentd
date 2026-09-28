import {selectionArguments,type Selection} from './adapters.ts';
import {execFileSync,spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

// This policy is validated against an exact native CLI version. Updates fail closed.
import {testedVersions} from './native-policy.ts';
export const CHAT_CODEX_VERSION=testedVersions.codex;
export function chatArguments(executable:string,prompt:string,env:NodeJS.ProcessEnv=process.env,selection?:Selection){
  if(execFileSync(executable,['--version'],{env,encoding:'utf8',timeout:5000,stdio:['ignore','pipe','pipe']}).trim()!==CHAT_CODEX_VERSION)throw Error('Chat only requires the validated Codex CLI version 0.157.1');
  const listing=execFileSync(executable,['features','list'],{env,encoding:'utf8',timeout:5000,maxBuffer:32768,stdio:['ignore','pipe','pipe']});
  const features=listing.trim().split('\n').map(line=>line.trim().split(/\s+/));
  if(features.some(parts=>!/^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)*$/.test(parts[0])||!['true','false'].includes(parts.at(-1)??''))||!features.some(parts=>parts[0]==='shell_tool'))throw Error('Unrecognized Codex feature inventory');
  const disabled=features.filter(parts=>!parts.includes('removed')&&!parts.includes('deprecated')).map(parts=>'features.'+parts[0]+'=false');
  return ['--strict-config',...selectionArguments('codex',selection),...['forced_login_method="chatgpt"','approval_policy="never"','web_search="disabled"',...disabled].flatMap(value=>['-c',value]),'exec','--ignore-user-config','--ignore-rules','--skip-git-repo-check','--sandbox','read-only','--ephemeral','--json','--',prompt];
}
// Only text messages are exposed to task logs. Native diagnostics/config/paths stay private.
export async function chat(executable:string,prompt:string,selection?:Selection){
  const child=spawn(executable,chatArguments(executable,prompt,process.env,selection),{stdio:['ignore','pipe','pipe']});
  let buffer='',completed=false,failed=false,size=0;
  const stop=()=>{failed=true;child.kill('SIGKILL');};
  child.stderr.on('data',()=>{});
  child.stdout.on('data',chunk=>{
    size+=chunk.length;if(size>2_000_000){stop();return;}buffer+=chunk.toString('utf8');
    for(let index;(index=buffer.indexOf('\n'))>=0;){const line=buffer.slice(0,index);buffer=buffer.slice(index+1);
      try{const event=JSON.parse(line);
        if(event.type==='item.completed'&&event.item?.type==='agent_message'&&typeof event.item.text==='string')process.stdout.write(event.item.text+'\n');
        if(event.type==='turn.completed')completed=true;
        if(event.type==='turn.failed')failed=true;
        // No execution event belongs in this mode; fail closed on unexpected capability use.
        if(['item.started','item.completed'].includes(event.type)&&event.item&&!['agent_message','reasoning','error'].includes(event.item.type))stop();
      }catch{stop();}
    }
  });
  const code=await new Promise<number|null>((resolve,reject)=>{child.on('error',reject);child.on('close',resolve);});
  if(code!==0||failed||!completed)throw Error('Chat could not complete. Check account status in Operations; the installed Codex version must match the validated chat policy.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  try{await chat(process.argv[2],process.argv[3],process.argv[4]?JSON.parse(process.argv[4]):undefined);}catch{console.error('Chat could not complete. Check account status in Operations and the supported Codex version.');process.exitCode=1;}
}
