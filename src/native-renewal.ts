// Fixed authentication commands only. No threads, prompts, tools or repository settings.
import {spawn,execFileSync} from 'node:child_process';
import {homedir} from 'node:os';
import {readCredentials} from './credentials.ts';
import {pathToFileURL} from 'node:url';
export async function nativeRenewal(id:string,executable:string,home=homedir()){
  const value=readCredentials(home,id);
  const env:NodeJS.ProcessEnv={...process.env,HOME:home,CODEX_HOME:home+'/.codex',BROWSER:'/usr/bin/false'};
  let args:string[];
  if(id==='claude'){
    if(execFileSync(executable,['--version'],{encoding:'utf8',timeout:10000,env}).trim()!=='2.1.283 (Claude Code)')throw Error('Unsupported Claude version');
    const o=value.claudeAiOauth;if(typeof o.refreshToken!=='string'||!o.refreshToken||!Array.isArray(o.scopes)||!o.scopes.length||o.scopes.some((s:unknown)=>typeof s!=='string'||!/^[-a-zA-Z0-9_:]+$/.test(s)))throw Error('Reconnect required');
    env.CLAUDE_CODE_OAUTH_REFRESH_TOKEN=o.refreshToken;env.CLAUDE_CODE_OAUTH_SCOPES=o.scopes.join(' ');
    args=['auth','login','--claudeai'];
  }else if(id==='codex'){
    if(execFileSync(executable,['--version'],{encoding:'utf8',timeout:10000,env}).trim()!=='codex-cli 0.157.1')throw Error('Unsupported Codex version');
    args=['-c','forced_login_method="chatgpt"','-c','cli_auth_credentials_store="file"','app-server'];
  }else throw Error('Unsupported account');
  await new Promise<void>((resolve,reject)=>{
    const child=spawn(executable,args,{cwd:process.cwd(),env,stdio:['pipe',id==='codex'?'pipe':'ignore','ignore']});let verified=false,buffer='',size=0;
    const stop=()=>child.kill('SIGKILL');const timer=setTimeout(stop,45000);
    const send=(v:unknown)=>child.stdin!.write(JSON.stringify(v)+'\n');child.stdin!.on('error',()=>{});
    if(id==='codex'){
      send({id:1,method:'initialize',params:{clientInfo:{name:'agentd-renewal',version:'1.0.0'},capabilities:{experimentalApi:false}}});
      child.stdout!.on('data',chunk=>{
        size+=chunk.length;if(size>65536){stop();return;}buffer+=chunk.toString();
        while(buffer.includes('\n')){
          const end=buffer.indexOf('\n'),line=buffer.slice(0,end);buffer=buffer.slice(end+1);
          try{const msg=JSON.parse(line);
            if(msg.id===1){if(msg.error){stop();return;}send({method:'initialized'});send({id:2,method:'account/read',params:{refreshToken:true}});}
            else if(msg.id===2){verified=!msg.error&&msg.result?.account?.type==='chatgpt';stop();}
            else if(msg.method&&msg.id!==undefined){stop();} // Never service tool/approval requests.
          }catch{stop();}
        }
      });
    }else child.stdin!.end();
    child.on('error',()=>{});child.on('close',code=>{clearTimeout(timer);if(id==='codex'?verified:code===0)resolve();else reject(Error('Native renewal failed'));});
  });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){try{await nativeRenewal(process.argv[3],process.argv[2],process.env.HOME);process.stdout.write('RENEWAL_OK\n');}catch{process.exitCode=1;}}
