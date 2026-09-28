import {namespacePolicy,sandboxCommand} from './sandbox-policy.ts';
import {readFileSync,lstatSync,realpathSync,mkdirSync,mkdtempSync,writeFileSync,rmSync,readdirSync,existsSync} from 'node:fs';
import {join,dirname,sep} from 'node:path';import {createHash} from 'node:crypto';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';import {checkRepositorySize} from './repositories.ts';
export function checkManifest(repo:string){
 const read=(name:string)=>{const path=join(repo,name),s=lstatSync(path);if(!s.isFile()||s.isSymbolicLink()||s.size>4*1024*1024)throw Error('Checks require regular package.json and package-lock.json files under 4 MB.');return readFileSync(path,'utf8');};
 const manifest=read('package.json'),lock=read('package-lock.json');let pkg:any,data:any;try{pkg=JSON.parse(manifest);data=JSON.parse(lock);if(!pkg||!data)throw Error();}catch{throw Error('Package files must contain valid JSON objects.');}
 if(pkg.packageManager&&!String(pkg.packageManager).startsWith('npm@'))throw Error('This setup supports npm projects only.');
 if(pkg.workspaces||![2,3].includes(data.lockfileVersion)||!data.packages||typeof data.packages!=='object')throw Error('Supported setup: single-package npm projects with a version 2 or 3 package-lock.json.');
 if(typeof pkg.scripts?.test!=='string'||!pkg.scripts.test.trim())throw Error('Add a test script to package.json before configuring checks.');
 if(pkg.scripts.typecheck!==undefined&&typeof pkg.scripts.typecheck!=='string')throw Error('Invalid typecheck script.');
 const specs=(values:any)=>{if(!values)return;for(const value of Object.values(values)){if(typeof value==='object'&&value!==null){specs(value);continue;}if(typeof value!=='string'||! /^(?:npm:(?:@[A-Za-z0-9_.-]+\/)?[A-Za-z0-9_.-]+@)?[A-Za-z0-9.*+^~<>=| -]+$/.test(value))throw Error('Only registry version ranges and npm aliases are supported; Git, file and URL dependencies are disabled.');}};
 for(const key of ['dependencies','devDependencies','optionalDependencies','peerDependencies','overrides'])specs(pkg[key]);
 let count=0;for(const [path,value] of Object.entries(data.packages) as [string,any][]){if(path==='')continue;count++;if(count>10000||!path.startsWith('node_modules/')||path.split('/').some(v=>v==='..'||v==='.')||value.link)throw Error('Workspaces, local links and oversized dependency graphs are unsupported.');
  let url:URL;try{url=new URL(value.resolved);}catch{throw Error('Every dependency must resolve to the public npm registry.');}
  if(url.protocol!=='https:'||url.hostname!=='registry.npmjs.org'||url.port||url.username||url.password||url.search||url.hash||typeof value.integrity!=='string'||!/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(value.integrity))throw Error('Only public npm registry packages with SHA-512 integrity are supported.');
 }
 const fingerprint=createHash('sha256').update(manifest).update('\0').update(lock).digest('hex'),lockHash=createHash('sha256').update(lock).digest('hex');
 return {manifest,lock,fingerprint,lockHash,count,scripts:{...(pkg.scripts.typecheck?{typecheck:pkg.scripts.typecheck}:{}),test:pkg.scripts.test}};
}
export function dependencySandbox(stage:string,state:string){
 if(process.platform!=='linux')throw Error('Dependency preparation requires Linux isolation.');
 const runtime=mkdtempSync(join(state,'worker-dependencies-')),home=join(runtime,'home'),network=join(runtime,'network');mkdirSync(home);mkdirSync(network);writeFileSync(join(home,'user.npmrc'),'');writeFileSync(join(home,'global.npmrc'),'');
 const source=dirname(fileURLToPath(import.meta.url)),node=realpathSync(process.execPath),npm=realpathSync(join(dirname(process.execPath),'npm'));
 const broker=spawn(node,[join(source,'egress-proxy.ts'),join(network,'egress.sock'),'npm',String(process.pid)],{env:{PATH:'/usr/local/bin:/usr/bin:/bin'},stdio:'ignore'});broker.on('error',()=>{});
 const mounts=[...namespacePolicy,'--proc','/proc','--dev','/dev','--tmpfs','/tmp','--dir','/run'];
 for(const path of ['/usr','/bin','/sbin','/lib','/lib64'])if(existsSync(path))mounts.push('--ro-bind',path,path);
 for(const path of ['/etc/ssl/certs','/etc/ca-certificates','/etc/ld.so.cache','/etc/nsswitch.conf','/etc/passwd','/etc/group','/etc/hosts'])if(existsSync(path))mounts.push('--ro-bind',realpathSync(path),path);
 if(!node.startsWith('/usr/'))mounts.push('--ro-bind',dirname(dirname(node)),dirname(dirname(node)));
 if(!npm.startsWith('/usr/'))mounts.push('--ro-bind',dirname(dirname(npm)),dirname(dirname(npm)));
 mounts.push('--ro-bind',source,source,'--bind',stage,'/workspace','--bind',home,'/home/checks','--ro-bind',network,'/run/dependency-egress','--chdir','/workspace','--setenv','HOME','/home/checks');
 return {...sandboxCommand([...mounts,'--',node,join(source,'worker-entry.ts'),'/run/dependency-egress/egress.sock',node,npm,'ci','--engine-strict','--ignore-scripts','--no-audit','--no-fund','--include=dev','--registry=https://registry.npmjs.org','--userconfig=/home/checks/user.npmrc','--globalconfig=/home/checks/global.npmrc','--cache=/workspace/.cache']),cleanup(){broker.kill('SIGTERM');rmSync(runtime,{recursive:true,force:true});}};
}
export type DependencyPreparation=(stage:string,state:string,signal:AbortSignal)=>Promise<void>;
export const prepareDependencies:DependencyPreparation=async(stage,state,signal)=>{
 const sandbox=dependencySandbox(stage,state);
 try{await new Promise<void>((resolve,reject)=>{
  const child=spawn(sandbox.command,sandbox.args,{env:{PATH:dirname(process.execPath)+':/usr/local/bin:/usr/bin:/bin',LANG:'C.UTF-8'},detached:true,stdio:'ignore'});let stopped=false;
  const kill=()=>{stopped=true;if(child.pid)try{process.kill(-child.pid,'SIGKILL');}catch{}};const timer=setTimeout(kill,240000);const monitor=setInterval(()=>{try{checkRepositorySize(stage);}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')kill();}},500);
  signal.addEventListener('abort',kill,{once:true});if(signal.aborted)kill();child.on('error',()=>{});child.on('close',code=>{clearTimeout(timer);clearInterval(monitor);signal.removeEventListener('abort',kill);if(child.pid)try{process.kill(-child.pid,'SIGKILL');}catch{};if(code===0&&!stopped)resolve();else reject(Error('Dependency preparation failed or was stopped. Check that the lockfile matches package.json and uses public npm packages; install scripts and private registries are unsupported.'));});
 });checkRepositorySize(stage);const modules=join(stage,'node_modules');mkdirSync(modules,{recursive:true});const root=realpathSync(modules);if(lstatSync(modules).isSymbolicLink())throw Error('Invalid dependency directory');
 const walk=(dir:string)=>{for(const name of readdirSync(dir)){const p=join(dir,name),s=lstatSync(p);if(s.isSymbolicLink()){const target=realpathSync(p);if(target!==root&&!target.startsWith(root+sep))throw Error('Dependency link escapes its directory.');}else if(s.isDirectory())walk(p);else if(!s.isFile())throw Error('Unsupported dependency file.');}};walk(modules);rmSync(join(stage,'.cache'),{recursive:true,force:true});
 }finally{sandbox.cleanup();}
};
export function writeManifests(stage:string,value:ReturnType<typeof checkManifest>){mkdirSync(stage,{recursive:true,mode:0o700});writeFileSync(join(stage,'package.json'),value.manifest,{mode:0o600});writeFileSync(join(stage,'package-lock.json'),value.lock,{mode:0o600});}
