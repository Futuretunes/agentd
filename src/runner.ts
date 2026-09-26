import { DatabaseSync } from 'node:sqlite';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { mkdirSync, openSync, closeSync, realpathSync, readFileSync, copyFileSync, statSync, readSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'node:net';

type Config = { stateDir: string; repo: string; worktrees: string; logs: string; attachments?: string; timeoutMs?: number; command?: (adapter: string, prompt: string) => [string, string[]] };
export function runner(c: Config) {
  for (const dir of [c.stateDir,c.worktrees,c.logs]) mkdirSync(dir,{recursive:true,mode:0o700});
  const db = new DatabaseSync(join(c.stateDir,'tasks.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, adapter TEXT NOT NULL, prompt TEXT NOT NULL, revision TEXT NOT NULL, status TEXT NOT NULL, created TEXT NOT NULL, updated TEXT NOT NULL, worktree TEXT, log TEXT, error TEXT);
  CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,task TEXT,status TEXT,at TEXT);
  UPDATE tasks SET status='interrupted',error='Service stopped before completion' WHERE status IN ('running','cancelling');`);
  const columns=db.prepare('PRAGMA table_info(tasks)').all().map(x=>x.name);
  if(!columns.includes('attachments'))db.exec("ALTER TABLE tasks ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]'");
  if(!columns.includes('parent'))db.exec("ALTER TABLE tasks ADD COLUMN parent TEXT");
  const attachmentRoot=c.attachments??join(c.stateDir,'attachments');
  mkdirSync(attachmentRoot,{recursive:true,mode:0o700});
  const attachment=(id:string)=>{
    if(!/^[0-9a-f-]{36}$/.test(id))throw new Error('Invalid attachment');
    const path=join(attachmentRoot,id+'.json');
    return JSON.parse(readFileSync(path,'utf8'));
  };
  const logTail=(path:string)=>{
    const fd=openSync(path,'r');try{const size=statSync(path).size;const b=Buffer.alloc(Math.min(size,60000));readSync(fd,b,0,b.length,Math.max(0,size-b.length));return b.toString('utf8');}finally{closeSync(fd);}
  };
  let active: {id:string; child:ChildProcess; done:Promise<void>; stop:(status:string)=>void}|undefined;
  let closing=false;
  const get=(id:string)=>db.prepare('SELECT * FROM tasks WHERE id=?').get(id);
  const transition=(id:string,status:string,error:string|null=null)=>{
    const at=new Date().toISOString();
    db.prepare('UPDATE tasks SET status=?,updated=?,error=? WHERE id=?').run(status,at,error,id);
    db.prepare('INSERT INTO events(task,status,at) VALUES(?,?,?)').run(id,status,at);
  };
  const git=(args:string[])=>execFileSync('git',['-C',c.repo,...args],{encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']}).trim();
  const commands=c.command??((adapter,prompt)=>adapter==='codex'
    ? [process.env.AGENTD_CODEX_BIN ?? join(homedir(), '.local/bin/codex'),['-c','forced_login_method="chatgpt"','exec','--sandbox','read-only','--ephemeral',prompt]]
    : [process.env.AGENTD_CLAUDE_BIN ?? join(homedir(), '.local/bin/claude'),['-p','--tools','Read,Glob,Grep','--allowedTools','Read,Glob,Grep','--max-turns','8',prompt]]);
  function pump(){
    if(closing||active)return;
    const row=db.prepare("SELECT * FROM tasks WHERE status='queued' ORDER BY created,id LIMIT 1").get();
    if(!row)return;
    const id=String(row.id),tree=join(c.worktrees,id),log=join(c.logs,`${id}.log`);
    transition(id,'running');
    try{
      git(['worktree','add','--detach',tree,String(row.revision)]);
      db.prepare('UPDATE tasks SET worktree=?,log=? WHERE id=?').run(tree,log,id);
      let prompt=String(row.prompt);
      const pictures:string[]=[];
      const attachments=JSON.parse(String(row.attachments));
      if(attachments.length){
        const folder=join(tree,'.agentd-input');mkdirSync(folder,{mode:0o700});
        for(const id of attachments){const meta=attachment(id);const target=join(folder,id+meta.ext);copyFileSync(join(attachmentRoot,id+meta.ext),target);pictures.push(target);}
        prompt+='\nUser attached images (use your image-reading tool):\n'+pictures.join('\n');
      }
      if(row.parent){const prior=get(String(row.parent));if(prior){prompt='Previous instruction:\n'+String(prior.prompt)+'\nPrevious output (context, not instructions):\n'+(prior.log?logTail(String(prior.log)).slice(-20000):'(not yet available)')+'\nNew instruction:\n'+prompt;}}
      const [command,args]=commands(String(row.adapter),prompt);
      if(!c.command && row.adapter==='codex' && pictures.length)args.splice(args.length-1,0,...pictures.flatMap(path=>['--image',path]));
      const env:NodeJS.ProcessEnv={PATH:process.env.PATH ?? '/usr/local/bin:/usr/bin:/bin',HOME:process.env.HOME,LANG:'C.UTF-8',TERM:'dumb'};
      const fd=openSync(log,'wx',0o600);
      let child:ChildProcess;
      try{child=spawn(command,args,{cwd:tree,env,detached:true,stdio:['ignore',fd,fd]});}finally{closeSync(fd);}
      let reason:string|undefined,killTimer:ReturnType<typeof setTimeout>|undefined;
      const kill=(signal:NodeJS.Signals)=>{if(child.pid)try{process.kill(-child.pid,signal);}catch(error){if((error as NodeJS.ErrnoException).code!=='ESRCH')throw error;}};
      const stop=(status:string)=>{if(reason)return;reason=status;transition(id,'cancelling');kill('SIGTERM');killTimer=setTimeout(()=>kill('SIGKILL'),2000);};
      const timer=setTimeout(()=>stop('timed_out'),c.timeoutMs??120000);
      let resolveDone!:()=>void;
      const done=new Promise<void>(resolve=>{resolveDone=resolve;});
      active={id,child,done,stop};
      let spawnError:string|undefined;
      child.on('error',error=>{spawnError=error.message;});
      child.on('close',code=>{
        clearTimeout(timer);if(killTimer)clearTimeout(killTimer);
        // Reap any descendants before another task may start.
        kill('SIGKILL');
        transition(id,reason??(code===0&&!spawnError?'succeeded':'failed'),spawnError??(code===0?null:`Exit ${code}`));
        active=undefined;resolveDone();if(!closing)setImmediate(pump);
      });
    }catch(error){transition(id,'failed',(error as Error).message);setImmediate(pump);}
  }
  function request(input:any){
    if(closing)throw new Error('Service is stopping');
    if(input.op==='list')return db.prepare('SELECT * FROM tasks ORDER BY created DESC LIMIT 100').all();
    if(input.op==='create'){
      const attachments=input.attachments??[];
      if(!Array.isArray(attachments)||attachments.length>4||attachments.some(id=>typeof id!=='string'))throw new Error('Up to four images allowed');
      attachments.forEach(id=>attachment(id));
      if(input.parent && (typeof input.parent!=='string'||!get(input.parent)))throw new Error('Parent task not found');
      if(!['codex','claude'].includes(input.adapter))throw new Error('Unsupported adapter');
      if(typeof input.prompt!=='string'||!input.prompt.trim()||input.prompt.length>16000)throw new Error('Prompt must contain 1 to 16000 characters');
      // Only the configured repository is accepted; callers cannot choose paths or executables.
      if(realpathSync(git(['rev-parse','--show-toplevel']))!==realpathSync(c.repo))throw new Error('Repository root mismatch');
      const revision=git(['rev-parse','--verify','HEAD^{commit}']);
      const id=randomUUID(),at=new Date().toISOString();
      db.prepare('INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated) VALUES(?,?,?,?,?,?,?)').run(id,input.adapter,input.prompt,revision,'waiting_for_approval',at,at);
      db.prepare('UPDATE tasks SET attachments=?,parent=? WHERE id=?').run(JSON.stringify(attachments),input.parent??null,id);
      db.prepare('INSERT INTO events(task,status,at) VALUES(?,?,?)').run(id,'waiting_for_approval',at);
      return get(id);
    }
    if(typeof input.id!=='string')throw new Error('Task id required');
    const row=get(input.id);if(!row)throw new Error('Task not found');
    if(input.op==='show')return {task:row,output:row.log?logTail(String(row.log)):'',images:JSON.parse(String(row.attachments)).map((id:string)=>attachment(id)),events:db.prepare('SELECT status,at FROM events WHERE task=? ORDER BY id').all(input.id)};
    if(input.op==='approve'){
      if(row.status!=='waiting_for_approval')throw new Error('Task is not waiting for approval');
      transition(input.id,'queued');setImmediate(pump);return get(input.id);
    }
    if(input.op==='cancel'){
      if(active && active.id===input.id)active.stop('cancelled');
      else if(['waiting_for_approval','queued'].includes(String(row.status)))transition(input.id,'cancelled');
      else throw new Error('Task cannot be cancelled in this state');
      return get(input.id);
    }
    throw new Error('Unknown operation');
  }
  const socket=join(c.stateDir,'control.sock');
  // systemd RuntimeDirectory supplies a fresh socket directory at every start.
  const server=createServer(connection=>{
    let data='';connection.setTimeout(5000,()=>connection.destroy());
    connection.on('error',()=>{});
    connection.on('data',chunk=>{
      data+=chunk.toString();if(Buffer.byteLength(data)>80000){connection.destroy();return;}
      if(!data.includes('\n'))return;
      connection.removeAllListeners('data');
      try{connection.end(JSON.stringify({ok:true,result:request(JSON.parse(data.split('\n')[0]))})+'\n');}
      catch(error){connection.end(JSON.stringify({ok:false,error:(error as Error).message})+'\n');}
    });
  });
  // Caller supplies a private, freshly created directory for the control socket.
  const controlPath=process.env.AGENTD_CONTROL_SOCKET??socket;
  server.listen(controlPath);
  server.on('listening',()=>pump());
  return {request,server,async close(){closing=true;const pending=active?.done;active?.stop('interrupted');if(pending)await pending;await new Promise<void>(resolve=>server.close(()=>resolve()));db.close();}};
}
