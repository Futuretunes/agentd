import { DatabaseSync } from 'node:sqlite';
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { homedir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { mkdirSync, openSync, closeSync, realpathSync, readFileSync, copyFileSync, statSync, readSync, existsSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { createServer } from 'node:net';

type Config = { stateDir: string; repo: string; worktrees: string; logs: string; projectsDir?: string; attachments?: string; timeoutMs?: number; command?: (adapter: string, prompt: string) => [string, string[]] };
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
  if(!columns.includes('project'))db.exec("ALTER TABLE tasks ADD COLUMN project TEXT");
  if(!columns.includes('conversation'))db.exec("ALTER TABLE tasks ADD COLUMN conversation TEXT");
  db.exec(`CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, name TEXT NOT NULL, repo TEXT NOT NULL UNIQUE, created TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS conversations(id TEXT PRIMARY KEY, project TEXT NOT NULL, title TEXT NOT NULL, created TEXT NOT NULL, archived INTEGER NOT NULL DEFAULT 0);`);
  const defaultRepo=realpathSync(c.repo);
  db.prepare('INSERT OR IGNORE INTO projects(id,name,repo,created) VALUES(?,?,?,?)').run('default','Original workspace',defaultRepo,new Date().toISOString());
  db.prepare("UPDATE tasks SET project='default' WHERE project IS NULL").run();
  const migrate=(row:any,seen=new Set<string>()):string=>{
    if(row.conversation)return String(row.conversation);
    if(seen.has(String(row.id)))throw new Error('Invalid task ancestry');
    seen.add(String(row.id));
    const parent=row.parent?db.prepare('SELECT * FROM tasks WHERE id=?').get(String(row.parent)):undefined;
    const id=parent?migrate(parent,seen):String(row.id);
    db.prepare('INSERT OR IGNORE INTO conversations(id,project,title,created) VALUES(?,?,?,?)').run(id,row.project,String(row.prompt).slice(0,100),row.created);
    db.prepare('UPDATE tasks SET conversation=? WHERE id=?').run(id,row.id);
    return id;
  };
  for(const row of db.prepare('SELECT * FROM tasks WHERE conversation IS NULL ORDER BY created,id').all())migrate(row);
  const project=(id:string)=>{const value=db.prepare('SELECT * FROM projects WHERE id=?').get(id);if(!value)throw new Error('Project not found');return value;};
  const conversation=(id:string)=>{const value=db.prepare('SELECT * FROM conversations WHERE id=?').get(id);if(!value)throw new Error('Conversation not found');return value;};
  const title=(value:unknown)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>100)throw new Error('Name must contain 1 to 100 characters');return value.trim();};
  const attachmentRoot=c.attachments??join(c.stateDir,'attachments');
  mkdirSync(attachmentRoot,{recursive:true,mode:0o700});
  const attachment=(id:string)=>{
    if(!/^[0-9a-f-]{36}$/.test(id))throw new Error('Invalid attachment');
    const path=join(attachmentRoot,id+'.json');
    return JSON.parse(readFileSync(path,'utf8'));
  };
  const logTail=(path:string)=>{
    if(!existsSync(path))return '';
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
  const git=(args:string[],repo=c.repo)=>execFileSync('git',['-C',repo,...args],{encoding:'utf8',timeout:15000,stdio:['ignore','pipe','pipe']}).trim();
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
      const repo=String(project(String(row.project)).repo);
      git(['worktree','add','--detach',tree,String(row.revision)],repo);
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
    if(input.op==='projects')return db.prepare(`SELECT p.*, (SELECT count(*) FROM conversations c WHERE c.project=p.id AND c.archived=0) AS conversations FROM projects p WHERE p.archived=0 ORDER BY p.created,p.id`).all();
    if(input.op==='project-create'||input.op==='project-register'){
      const name=title(input.name),id=randomUUID();let repo:string;
      if(input.op==='project-register'){
        if(typeof input.repo!=='string'||!isAbsolute(input.repo))throw new Error('Absolute repository path required');
        repo=realpathSync(input.repo);
        if(realpathSync(git(['rev-parse','--show-toplevel'],repo))!==repo)throw new Error('Repository root mismatch');
        git(['rev-parse','--verify','HEAD^{commit}'],repo);
      }else{
        repo=join(c.projectsDir??join(c.stateDir,'projects'),id);mkdirSync(repo,{recursive:true,mode:0o700});
        git(['init','-b','main'],repo);
        git(['-c','user.name=agentd','-c','user.email=agentd@localhost','commit','--allow-empty','-m','Initialize project'],repo);
      }
      db.prepare('INSERT INTO projects(id,name,repo,created) VALUES(?,?,?,?)').run(id,name,repo,new Date().toISOString());return project(id);
    }
    if(input.op==='project-rename'){project(input.id);db.prepare('UPDATE projects SET name=? WHERE id=?').run(title(input.name),input.id);return project(input.id);}
    if(input.op==='conversations'){
      project(input.project);
      return db.prepare(`SELECT c.*, (SELECT status FROM tasks t WHERE t.conversation=c.id ORDER BY created DESC,rowid DESC LIMIT 1) AS status,
        (SELECT adapter FROM tasks t WHERE t.conversation=c.id ORDER BY created DESC,rowid DESC LIMIT 1) AS adapter,
        (SELECT max(created) FROM tasks t WHERE t.conversation=c.id) AS updated
        FROM conversations c WHERE c.project=? AND c.archived=0 ORDER BY updated DESC LIMIT 100`).all(input.project);
    }
    if(input.op==='conversation-show'){
      const thread=conversation(input.id);
      const rows=db.prepare('SELECT * FROM (SELECT rowid AS sequence,* FROM tasks WHERE conversation=? ORDER BY created DESC,rowid DESC LIMIT 30) ORDER BY created,sequence').all(input.id);
      return {conversation:thread,project:project(String(thread.project)),messages:rows.map(row=>({...row,output:row.log?logTail(String(row.log)):'',images:JSON.parse(String(row.attachments)).map((id:string)=>attachment(id))}))};
    }
    if(input.op==='conversation-rename'){conversation(input.id);db.prepare('UPDATE conversations SET title=? WHERE id=?').run(title(input.name),input.id);return conversation(input.id);}
    if(input.op==='conversation-archive'){
      conversation(input.id);
      if(db.prepare("SELECT id FROM tasks WHERE conversation=? AND status IN ('waiting_for_approval','queued','running','cancelling')").get(input.id))throw new Error('Finish or cancel pending tasks before archiving');
      db.prepare('UPDATE conversations SET archived=1 WHERE id=?').run(input.id);return {ok:true};
    }
    if(input.op==='list')return db.prepare('SELECT * FROM tasks ORDER BY created DESC LIMIT 100').all();
    if(input.op==='create'){
      const attachments=input.attachments??[];
      if(!Array.isArray(attachments)||attachments.length>4||attachments.some(id=>typeof id!=='string'))throw new Error('Up to four images allowed');
      attachments.forEach(id=>attachment(id));
      if(input.parent && (typeof input.parent!=='string'||!get(input.parent)))throw new Error('Parent task not found');
      if(!['codex','claude'].includes(input.adapter))throw new Error('Unsupported adapter');
      if(typeof input.prompt!=='string'||!input.prompt.trim()||input.prompt.length>16000)throw new Error('Prompt must contain 1 to 16000 characters');
      const prior=input.parent?get(input.parent):undefined;
      const threadId=input.conversation??prior?.conversation;
      const thread=threadId?conversation(String(threadId)):undefined;
      const projectId=input.project??thread?.project??'default';
      const selectedProject=project(projectId);
      if(selectedProject.archived||thread?.archived)throw new Error('Workspace is archived');
      if(thread&&thread.project!==projectId)throw new Error('Conversation belongs to another project');
      if(prior&&(prior.project!==projectId||prior.conversation!==threadId))throw new Error('Parent belongs to another conversation');
      if(thread&&db.prepare("SELECT id FROM tasks WHERE conversation=? AND status IN ('waiting_for_approval','queued','running','cancelling')").get(String(thread.id)))throw new Error('Finish or cancel the current turn before sending another');
      const parent=prior??(thread?db.prepare('SELECT * FROM tasks WHERE conversation=? ORDER BY created DESC,rowid DESC LIMIT 1').get(String(thread.id)):undefined);
      const repo=String(selectedProject.repo);
      if(realpathSync(git(['rev-parse','--show-toplevel'],repo))!==realpathSync(repo))throw new Error('Repository root mismatch');
      const revision=git(['rev-parse','--verify','HEAD^{commit}'],repo);
      const id=randomUUID(),at=new Date().toISOString(),conversationId=threadId??randomUUID();
      db.exec('BEGIN');
      try{
        if(!thread)db.prepare('INSERT INTO conversations(id,project,title,created) VALUES(?,?,?,?)').run(conversationId,projectId,input.prompt.trim().slice(0,100),at);
        db.prepare('INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,project,conversation,attachments,parent) VALUES(?,?,?,?,?,?,?,?,?,?,?)').run(id,input.adapter,input.prompt,revision,'waiting_for_approval',at,at,projectId,conversationId,JSON.stringify(attachments),parent?.id??null);
        db.prepare('INSERT INTO events(task,status,at) VALUES(?,?,?)').run(id,'waiting_for_approval',at);
        db.exec('COMMIT');
      }catch(error){db.exec('ROLLBACK');throw error;}
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
