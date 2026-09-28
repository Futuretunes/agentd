// Offline native protocol startup probe: never authenticates or submits a prompt.
import {spawn,execFileSync} from 'node:child_process';
import {cursorVersion} from './cursor-policy.ts';
const binary=process.argv[2];
if(execFileSync(binary,['--version'],{encoding:'utf8',stdio:['ignore','pipe','ignore'],timeout:10000}).trim()!==cursorVersion)throw Error('Unsupported Cursor version');
const child=spawn(binary,['--sandbox','enabled','acp'],{stdio:['pipe','pipe','ignore']});
try{
 await new Promise<void>((resolve,reject)=>{let buffer='';const timer=setTimeout(()=>reject(Error('Cursor initialize timed out')),20000);const done=(error?:Error)=>{clearTimeout(timer);error?reject(error):resolve();};child.on('error',()=>done(Error('Cursor failed to start')));child.on('exit',()=>done(Error('Cursor exited before initialization')));child.stdin.on('error',()=>done(Error('Cursor connection closed')));child.stdout.on('data',chunk=>{buffer+=chunk;if(buffer.length>100000)return done(Error('Unexpected Cursor response'));const line=buffer.split('\n')[0];if(!buffer.includes('\n'))return;try{const m=JSON.parse(line);if(m.id!==1||m.result?.protocolVersion!==1||!m.result?.authMethods?.some((a:any)=>a.id==='cursor_login'))throw Error();done();}catch{done(Error('Unsupported Cursor ACP response'));}});child.stdin.end(JSON.stringify({jsonrpc:'2.0',id:1,method:'initialize',params:{protocolVersion:1,clientCapabilities:{fs:{readTextFile:false,writeTextFile:false},terminal:false}}})+'\n');});
 console.log('CURSOR_ACP_OK');
}finally{child.kill('SIGKILL');}
