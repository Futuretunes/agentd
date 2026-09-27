import {createServer,createConnection,isIP,BlockList,type Socket} from 'node:net';
import {lookup} from 'node:dns/promises';
import {chmodSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

export const providerHosts:Record<string,readonly string[]>={
  claude:['api.anthropic.com','claude.ai','platform.claude.com'],
  codex:['chatgpt.com','auth.openai.com','api.openai.com'],
};
const denied=new BlockList();
for(const [ip,prefix] of [['0.0.0.0',8],['10.0.0.0',8],['100.64.0.0',10],['127.0.0.0',8],['169.254.0.0',16],['172.16.0.0',12],['192.0.0.0',24],['192.0.2.0',24],['192.88.99.0',24],['192.168.0.0',16],['198.18.0.0',15],['198.51.100.0',24],['203.0.113.0',24],['224.0.0.0',3]] as const)denied.addSubnet(ip,prefix,'ipv4');
const global6=new BlockList();global6.addSubnet('2000::',3,'ipv6');
const denied6=new BlockList();for(const [ip,prefix] of [['2001::',23],['2001:db8::',32],['2002::',16]] as const)denied6.addSubnet(ip,prefix,'ipv6');
export function publicAddress(ip:string){const family=isIP(ip);return family===4?!denied.check(ip,'ipv4'):family===6&&global6.check(ip,'ipv6')&&!denied6.check(ip,'ipv6');}
export function destination(header:string,adapter:string){
  const line=header.split('\r\n')[0];const match=/^CONNECT ([a-z0-9.-]+):443 HTTP\/1\.[01]$/.exec(line);
  if(!match||!providerHosts[adapter]?.includes(match[1]))throw Error('Destination denied');
  return match[1];
}
export function startProxy(socket:string,adapter:string){
  if(!providerHosts[adapter])throw Error('Unknown provider');
  const peers=new Set<Socket>();
  const server=createServer(client=>{
    if(peers.size>=32){client.destroy();return;}peers.add(client);client.once('close',()=>peers.delete(client));client.on('error',()=>{});
    let input=Buffer.alloc(0),upstream:Socket|undefined;client.setTimeout(10000,()=>client.destroy());
    client.once('close',()=>upstream?.destroy());
    const receive=(chunk:Buffer)=>{
      input=Buffer.concat([input,chunk]);if(input.length>8192){client.destroy();return;}
      const end=input.indexOf('\r\n\r\n');if(end<0)return;client.removeListener('data',receive);client.pause();
      let host:string;try{host=destination(input.subarray(0,end).toString('ascii'),adapter);}catch{client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
      // Resolve once, reject mixed public/private answers, and connect to that pinned IP.
      void lookup(host,{all:true}).then(addresses=>{
        if(client.destroyed)return;
        if(!addresses.length||addresses.some(value=>!publicAddress(value.address)))throw Error('Address denied');
        const address=addresses.find(value=>value.family===4)??addresses[0];
        upstream=createConnection({host:address.address,port:443,family:address.family});peers.add(upstream);const target=upstream;
        target.once('close',()=>{peers.delete(target);client.destroy();});target.on('error',()=>client.destroy());target.setTimeout(180000,()=>target.destroy());
        target.once('connect',()=>{if(client.destroyed){target.destroy();return;}client.setTimeout(180000);client.write('HTTP/1.1 200 Connection Established\r\n\r\n');const rest=input.subarray(end+4);if(rest.length)target.write(rest);client.pipe(target);target.pipe(client);client.resume();});
      }).catch(()=>client.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n'));
    };client.on('data',receive);
  });
  server.listen(socket,()=>chmodSync(socket,0o600));
  return {server,close(){for(const peer of peers)peer.destroy();server.close();}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  process.umask(0o077);const app=startProxy(process.argv[2],process.argv[3]);
  app.server.on('error',()=>process.exit(1));process.on('SIGTERM',()=>app.close());
  // A broker cannot outlive its owning runner, including after an unclean crash.
  const parent=Number(process.argv[4]??process.ppid);if(process.ppid!==parent)process.exit(1);setInterval(()=>{if(process.ppid!==parent)process.exit(1);},1000).unref();
}
