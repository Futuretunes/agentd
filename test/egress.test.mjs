import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {createConnection} from 'node:net';
import {publicAddress,destination,startProxy} from '../src/egress-proxy.ts';
test('provider destinations reject private, reserved and alternate targets',()=>{
 for(const ip of ['127.0.0.1','10.1.1.1','192.168.1.20','169.254.169.254','172.16.0.1','100.64.0.1','0.0.0.0','224.0.0.1','198.18.0.1','::1','::ffff:8.8.8.8','fc00::1','fe80::1','2001:db8::1','2002:0808:0808::1','invalid'])assert.equal(publicAddress(ip),false,ip);
 for(const ip of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])assert.equal(publicAddress(ip),true,ip);
 assert.equal(destination('CONNECT api2.cursor.sh:443 HTTP/1.1','cursor'),'api2.cursor.sh');
 for(const target of ['api.openai.com','downloads.cursor.com','api2.cursor.sh.evil.test','127.0.0.1'])assert.throws(()=>destination('CONNECT '+target+':443 HTTP/1.1','cursor'));
 assert.equal(destination('CONNECT api.anthropic.com:443 HTTP/1.1','claude'),'api.anthropic.com');
 for(const target of ['CONNECT api.anthropic.com:80 HTTP/1.1','CONNECT 127.0.0.1:443 HTTP/1.1','CONNECT api.anthropic.com.evil.com:443 HTTP/1.1','CONNECT evil.com:443 HTTP/1.1','CONNECT api.openai.com:443 HTTP/1.1','GET https://api.anthropic.com/ HTTP/1.1','CONNECT user@api.anthropic.com:443 HTTP/1.1'])assert.throws(()=>destination(target,'claude'));
});
test('broker refuses non-provider tunnels without making an outbound request',async()=>{
 const root=mkdtempSync(join(tmpdir(),'proxy-')),path=join(root,'proxy.sock'),proxy=startProxy(path,'claude');
 try{
  await once(proxy.server,'listening');
  const client=createConnection(path);let output='';client.on('data',chunk=>output+=chunk);
  await once(client,'connect');client.write('CONNECT 192.168.1.20:443 HTTP/1.1\r\n\r\n');await once(client,'end');
  assert.match(output,/403 Forbidden/);
 }finally{proxy.close();rmSync(root,{recursive:true,force:true});}
});
