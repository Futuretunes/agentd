import {createServer} from 'node:https';
import {createConnection} from 'node:net';
import {readFileSync,writeFileSync,mkdirSync,readdirSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {randomBytes,randomUUID,createHash,timingSafeEqual} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import type {IncomingMessage} from 'node:http';
type Config={key:string;cert:string;accessHash:string;origin:string;host:string;port:number;socket:string;attachments:string;publicDir:string};
export function mobile(c:Config){
 const sessions=new Map<string,number>(),attempts=new Map<string,{count:number;until:number}>();
 mkdirSync(c.attachments,{recursive:true,mode:0o700});
 const call=(input:unknown)=>new Promise<any>((resolve,reject)=>{
  const s=createConnection(c.socket);let text='';s.setTimeout(10000,()=>s.destroy(new Error('Runner timed out')));
  s.on('connect',()=>s.write(JSON.stringify(input)+'\n'));s.on('data',b=>{text+=b;if(text.length>4_000_000)s.destroy(new Error('Response too large'));});
  s.on('error',reject);s.on('end',()=>{try{const value=JSON.parse(text);if(!value.ok)reject(new Error(value.error));else resolve(value.result);}catch(e){reject(e);}});
 });
 async function body(req:IncomingMessage){let n=0;const chunks:Buffer[]=[];for await(const b of req){n+=b.length;if(n>7_500_000)throw new Error('Request too large');chunks.push(b);}return JSON.parse(Buffer.concat(chunks).toString());}
 const server=createServer({key:readFileSync(c.key),cert:readFileSync(c.cert)},async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const send=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  try{
   const path=(req.url??'/').split('?')[0];
   if(req.method==='GET'&&['/','/app.js','/style.css'].includes(path)){
    const file=path==='/'?'index.html':path.slice(1);res.writeHead(200,{'Content-Type':file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.js')?'text/javascript':'text/css'});res.end(readFileSync(join(c.publicDir,file)));return;
   }
   if(req.method==='POST'){
    if(req.headers.origin!==c.origin||req.headers['content-type']!=='application/json'){send(403,{error:'Invalid request origin or content type'});return;}
   }
   if(path==='/api/login'&&req.method==='POST'){
    const address=req.socket.remoteAddress??'unknown',now=Date.now();
    for(const [key,value]of attempts)if(value.until<now)attempts.delete(key);
    for(const [key,value]of sessions)if(value<now)sessions.delete(key);
    const attempt=attempts.get(address)??{count:0,until:now+60000};
    if(attempt.count>=10){send(429,{error:'Too many attempts. Try again in one minute.'});return;}
    attempt.count++;attempts.set(address,attempt);
    const input=await body(req);const hash=createHash('sha256').update(String(input.key??'')).digest();const expected=Buffer.from(c.accessHash,'hex');
    if(expected.length!==32||!timingSafeEqual(hash,expected)){send(401,{error:'Access key did not match'});return;}
    const id=randomBytes(32).toString('hex');sessions.set(id,now+43200000);if(sessions.size>100)sessions.delete(sessions.keys().next().value!);
    res.setHeader('Set-Cookie',`agentd_session=${id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`);send(200,{ok:true});return;
   }
   const id=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('agentd_session='))?.slice(15);
   if(!id||(sessions.get(id)??0)<Date.now()){send(401,{error:'Sign in to continue'});return;}
   if(path==='/api/logout'&&req.method==='POST'){sessions.delete(id);res.setHeader('Set-Cookie','agentd_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');send(200,{ok:true});return;}
   if(path==='/api/tasks'&&req.method==='GET'){send(200,await call({op:'list'}));return;}
   const match=path.match(/^\/api\/tasks\/([0-9a-f-]{36})$/);
   if(match&&req.method==='GET'){send(200,await call({op:'show',id:match[1]}));return;}
   if(path==='/api/action'&&req.method==='POST'){
    const input=await body(req);if(!['create','approve','cancel'].includes(input.op))throw new Error('Unsupported action');
    send(200,await call(input));return;
   }
   if(path==='/api/upload'&&req.method==='POST'){
    const input=await body(req);if(typeof input.data!=='string'||input.data.length>7_000_000)throw new Error('Image too large');
    const bytes=Buffer.from(input.data,'base64');if(bytes.length<16||bytes.length>5*1024*1024)throw new Error('Images must be at most 5 MB');
    const ext=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))?'.png':bytes[0]===255&&bytes[1]===216&&bytes[2]===255?'.jpg':null;
    if(!ext)throw new Error('Choose a JPEG or PNG image');
    const total=readdirSync(c.attachments).reduce((n,name)=>n+statSync(join(c.attachments,name)).size,0);if(total+bytes.length>200*1024*1024)throw new Error('Attachment storage is full');
    const uuid=randomUUID(),meta={id:uuid,ext,name:String(input.name??'Image').replace(/[\x00-\x1f]/g,'').slice(0,120)};
    writeFileSync(join(c.attachments,uuid+ext),bytes,{flag:'wx',mode:0o600});writeFileSync(join(c.attachments,uuid+'.json'),JSON.stringify(meta),{flag:'wx',mode:0o600});send(201,meta);return;
   }
   const img=path.match(/^\/api\/images\/([0-9a-f-]{36})$/);
   if(img&&req.method==='GET'){const meta=JSON.parse(readFileSync(join(c.attachments,img[1]+'.json'),'utf8'));res.writeHead(200,{'Content-Type':meta.ext==='.png'?'image/png':'image/jpeg'});res.end(readFileSync(join(c.attachments,img[1]+meta.ext)));return;}
   send(404,{error:'Not found'});
  }catch(error){send(400,{error:(error as Error).message});}
 });
 server.requestTimeout=20000;server.headersTimeout=10000;server.listen(c.port,c.host);return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 process.umask(0o077);const config=JSON.parse(readFileSync(process.env.AGENTD_MOBILE_CONFIG??'/etc/agentd/mobile.json','utf8'));
 const server=mobile({socket:'/run/agentd/control.sock',attachments:'/srv/agentd/state/attachments',publicDir:'/opt/agentd/public',...config});
 server.on('listening',()=>console.log(JSON.stringify({event:'mobile_listening',origin:config.origin})));
 server.on('error',error=>{console.error(error.message);process.exit(1);});
 process.on('SIGTERM',()=>{server.close();server.closeAllConnections();});
}
