import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,chmodSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {discover,invocation} from '../src/adapters.ts';
test('native adapter invocations preserve sandbox, tools and literal user arguments',()=>{
 const prompt='literal $(touch unwanted); --dangerously-skip-permissions';
 const [,codex]=invocation('codex',{prompt,mode:'edit',images:['/tmp/a photo.png']});
 assert.equal(codex[codex.indexOf('--sandbox')+1],'workspace-write');assert.equal(codex.at(-1),prompt);assert.equal(codex[codex.indexOf('--image')+1],'/tmp/a photo.png');assert.ok(!codex.includes('--dangerously-bypass-approvals-and-sandbox'));
 const [,ask]=invocation('codex',{prompt,mode:'ask',images:[]});assert.equal(ask[ask.indexOf('--sandbox')+1],'read-only');
 const [,claude]=invocation('claude',{prompt,mode:'ask',images:[]});assert.equal(claude[claude.indexOf('--tools')+1],'Read,Glob,Grep');assert.equal(claude[claude.indexOf('--permission-mode')+1],'dontAsk');assert.equal(claude.at(-1),prompt);
 const [,edit]=invocation('claude',{prompt,mode:'edit',images:[]});assert.equal(edit[edit.indexOf('--allowedTools')+1],'Read,Glob,Grep,Edit,Write');
 assert.throws(()=>invocation('cursor',{prompt,mode:'ask',images:[]}),/Unsupported/);assert.throws(()=>invocation('claude',{prompt,mode:'unsafe',images:[]}),/Unsupported/);
});
test('discovery distinguishes installation from policy without running CLI or checking credentials',()=>{
 const root=mkdtempSync(join(tmpdir(),'adapters-')),bin=join(root,'cli');const prior=process.env.AGENTD_CLAUDE_BIN;
 try{
  process.env.AGENTD_CLAUDE_BIN=bin;
  let value=discover(['claude'],['claude']).find(x=>x.id==='claude');assert.equal(value.installed,false);assert.equal(value.available,false);assert.match(value.reason,/missing/);
  writeFileSync(bin,'not executed');chmodSync(bin,0o600);assert.equal(discover(['claude'],[]).find(x=>x.id==='claude').available,false);
  chmodSync(bin,0o700);value=discover(['claude'],['claude']).find(x=>x.id==='claude');assert.equal(value.available,true);assert.deepEqual(value.modes,['ask','edit']);assert.equal(value.authentication,'not_checked');assert.ok(!JSON.stringify(value).includes(bin));
  value=discover([],['claude']).find(x=>x.id==='claude');assert.equal(value.installed,true);assert.equal(value.available,false);assert.match(value.reason,/security policy/);assert.deepEqual(value.modes,[]);
 }finally{if(prior===undefined)delete process.env.AGENTD_CLAUDE_BIN;else process.env.AGENTD_CLAUDE_BIN=prior;rmSync(root,{recursive:true,force:true});}
});
