// Offline by default: empty profile, local mock provider, no credentials or model calls.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,existsSync,rmSync} from 'node:fs';
import {homedir,tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {chatArguments} from '../src/codex-chat.ts';
const cli=process.argv[2]??join(homedir(),'.local/bin/codex');
const root=mkdtempSync(join(tmpdir(),'chat-proof-')),home=join(root,'home');mkdirSync(home);mkdirSync(join(home,'.codex'));
const env={HOME:home,CODEX_HOME:join(home,'.codex'),PATH:process.env.PATH,LANG:'C.UTF-8'};
let count=0,fail='',output='';
const calls=['exec_command','shell','shell_command','spawn_agent','mcp__fixture__run','browser','view_image','functions.exec'];
const injected=calls.map((name,i)=>({type:'function_call',id:'fc_'+i,call_id:'call_'+i,name,arguments:JSON.stringify({cmd:'touch SHOULD_NOT_EXIST',command:'touch SHOULD_NOT_EXIST'})}));
injected.push({type:'custom_tool_call',id:'ct_patch',call_id:'call_patch',name:'apply_patch',input:'*** Begin Patch\n*** Add File: SHOULD_NOT_EXIST\n+bad\n*** End Patch'});
writeFileSync(join(home,'MARKER'),'not exposed');
const server=createServer(async(req,res)=>{
 try{
  let raw='';for await(const b of req)raw+=b;
  const value=JSON.parse(raw);assert.ok(!value.tools||value.tools.length===0,'Native CLI advertised tools');
  if(count){const outputs=value.input.filter(x=>x.type?.endsWith('_output'));assert.equal(outputs.length,injected.length);for(const item of outputs)assert.match(String(item.output),item.call_id==='call_patch'?/patch rejected: writing is blocked by read-only sandbox/:/unsupported call|unknown tool/i);}
  const items=count++===0?injected:[{type:'message',id:'msg_ok',role:'assistant',status:'completed',content:[{type:'output_text',text:'CHAT_OFFLINE_OK',annotations:[]}]}];
  res.writeHead(200,{'content-type':'text/event-stream'});
  const event=(type,data)=>res.write('event: '+type+'\ndata: '+JSON.stringify({type,...data})+'\n\n');
  event('response.created',{response:{id:'response_'+count,status:'in_progress',output:[]}});
  items.forEach((item,i)=>event('response.output_item.done',{output_index:i,item}));
  event('response.completed',{response:{id:'response_'+count,status:'completed',output:items,usage:{input_tokens:1,output_tokens:1,total_tokens:2}}});res.end();
 }catch(error){fail=error.message;res.writeHead(400);res.end('Offline test failed');}
});
try{
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const override=['model_provider="probe"','model_providers.probe.name="offline probe"',`model_providers.probe.base_url="http://127.0.0.1:${server.address().port}/v1"`,'model_providers.probe.wire_api="responses"','model_providers.probe.requires_openai_auth=false'];
 const child=spawn(cli,[...override.flatMap(v=>['-c',v]),...chatArguments(cli,'Reply with OK',env)],{cwd:home,env,stdio:['ignore','pipe','pipe']});
 child.stdout.on('data',b=>output+=b);child.stderr.on('data',()=>{});
 const timer=setTimeout(()=>child.kill('SIGKILL'),20000);const [code]=await once(child,'close');clearTimeout(timer);
 assert.equal(fail,'');assert.equal(code,0);assert.equal(count,2);assert.match(output,/CHAT_OFFLINE_OK/);assert.equal(existsSync(join(home,'SHOULD_NOT_EXIST')),false);assert.equal(readFileSync(join(home,'MARKER'),'utf8'),'not exposed');
 console.log('codex: zero tools advertised; injected command, patch, subagent, browser, image and MCP calls rejected; text response received (offline)');
}finally{server.closeAllConnections();server.close();rmSync(root,{recursive:true,force:true});}
