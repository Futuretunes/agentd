const $ = id => document.getElementById(id);
let projectId = null, selected = null, uploads = [], signedIn = false, busy = false, generation = 0;
let policy={editAdapters:[],enabledAdapters:['codex','claude']};
function applyPolicy(){for(const option of $('adapter').options)option.disabled=!policy.enabledAdapters.includes(option.value);if(!policy.enabledAdapters.includes($('adapter').value))$('adapter').value=policy.enabledAdapters[0]??'';const canEdit=policy.editAdapters.includes($('adapter').value);$('mode').querySelector('[value=edit]').disabled=!canEdit;if(!canEdit)$('mode').value='ask';$('policy-hint').textContent=policy.strictWorkers?'Isolated workers · provider-only network access · approval required'+(!policy.enabledAdapters.includes('codex')?' · Codex unavailable under the current security policy.':'.'):'Each message waits for approval before an agent starts.';}
$('adapter').onchange=applyPolicy;
let reviewTask=null,reviewTree=null,checking=false;
let projects = [], latest = null, fingerprint = '', uploading = false;
const labels = {waiting_for_approval:'Ready for your approval',queued:'Queued',running:'Working',cancelling:'Stopping',cancelled:'Cancelled',succeeded:'Finished · review result',failed:'Failed',interrupted:'Interrupted',timed_out:'Time limit reached'};
const pending = status => ['waiting_for_approval','queued','running','cancelling'].includes(status);
function notice(text = '') { $('notice').textContent = text; $('notice').hidden = !text; }
function node(tag,text,cls) { const e = document.createElement(tag); if(text !== undefined)e.textContent=text; if(cls)e.className=cls; return e; }
async function api(path,data) {
  const res = await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});
  const value=await res.json();
  if(res.status===401){signedIn=false;$('workspace').hidden=true;$('login').hidden=false;}
  if(!res.ok)throw Error(value.error??'Request failed'); return value;
}
function button(text,callback,cls='') {
  const b=node('button',text,cls);b.type='button';b.onclick=async()=>{b.disabled=true;try{await callback();await refresh();}catch(e){notice(e.message);}finally{b.disabled=false;}};return b;
}
function reset(thread=null) { selected=thread;generation++;fingerprint='';latest=null;uploads=[];renderUploads();$('prompt').value='';$('project-info').hidden=true; }
function renderUploads(){ $('attachments').replaceChildren(...uploads.map(item=>button(item.name+' ×',()=>{uploads=uploads.filter(x=>x.id!==item.id);renderUploads();}))); }
function images(items){const box=node('div',undefined,'images');for(const item of items){const a=node('a');a.href='/api/images/'+item.id;a.target='_blank';a.rel='noopener';const img=node('img');img.src=a.href;img.alt=item.name;a.append(img);box.append(a);}return box;}
function empty(){
  const d=$('detail');d.replaceChildren();const intro=node('div',undefined,'welcome');intro.append(node('div','◈','welcome-icon'),node('p',projects.find(p=>p.id===projectId)?.name??'Your workspace','eyebrow'),node('h2','What shall we work on?'),node('p','Start a conversation. Choose an agent. You decide when it runs.','muted'));
  const ideas=node('div',undefined,'suggestions');for(const text of ['Explain this project','Review the architecture','Plan the next milestone'])ideas.append(button(text,()=>{$('prompt').value=text;$('prompt').focus();}));intro.append(ideas);d.append(intro);
}
function renderThread(data){
  $('thread-title').textContent=data.conversation.title;
  const d=$('detail'),nearBottom=d.scrollHeight-d.scrollTop-d.clientHeight<120;d.replaceChildren();
  for(const t of data.messages){
    const turn=node('article',undefined,'turn');const user=node('div',undefined,'user-message');user.append(node('div',t.prompt,'message-text'),images(t.images??[]));turn.append(user);
    const response=node('div',undefined,'agent-message');const head=node('div',undefined,'message-head');head.append(node('strong',t.adapter==='codex'?'◈ Codex':'✳ Claude'),node('span',labels[t.status]??t.status,'status '+t.status));response.append(head);
    if(t.output)response.append(node('pre',t.output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g,''),'result'));else response.append(node('p',t.status==='waiting_for_approval'?t.mode==='edit'?'This run may edit files in its worktree. Review your message, then approve.':'Review your message, then approve this run.':pending(t.status)?'Your agent’s output will appear here.':'No output was recorded.','muted'));
    if(t.error)response.append(node('p',t.error,'error'));
    const actions=node('div',undefined,'actions');if(t.status==='waiting_for_approval'){actions.append(button('Approve & run',()=>api('/api/action',{op:'approve',id:t.id}),'primary'),button('Reject',()=>api('/api/action',{op:'cancel',id:t.id})));}
    else if(['queued','running'].includes(t.status))actions.append(button('Stop run',()=>api('/api/action',{op:'cancel',id:t.id}),'danger'));
    if(t.mode==='edit'){response.append(node('p','Edit files · '+(t.review??'changes require a separate review'),'muted'));if(t.worktree&&!pending(t.status))actions.append(button(t.review==='committed'?'View committed changes':'Review changes',()=>openReview(t.id)));}
    response.append(actions);const meta=node('details');meta.append(node('summary','Run details'),node('p',`Revision ${t.revision.slice(0,12)} · ${new Date(t.created).toLocaleString()}`,'muted'),node('p',t.worktree??'A worktree will be created after approval.','path'));response.append(meta);turn.append(response);d.append(turn);
  }
  if(data.messages.length===30)d.prepend(node('p','Showing the latest 30 turns.','muted'));
  if(nearBottom||!fingerprint)d.scrollTop=d.scrollHeight;
}
async function refresh(){
  if(busy)return;busy=true;const epoch=generation;
  try{
    const capabilities=await api('/api/capabilities');policy={editAdapters:capabilities.editAdapters??[],enabledAdapters:capabilities.enabledAdapters??['codex','claude'],strictWorkers:capabilities.strictWorkers};applyPolicy();
    const list=await api('/api/projects');if(epoch!==generation)return;projects=list;
    signedIn=true;$('login').hidden=true;$('workspace').hidden=false;
    if(!projects.some(p=>p.id===projectId))projectId=projects[0]?.id??null;
    $('projects').replaceChildren(...projects.map(p=>{const b=button('',()=>{projectId=p.id;reset();},'project'+(p.id===projectId?' selected':''));b.append(node('span','▱ '+p.name),node('small',String(p.conversations)));return b;}));
    $('project-name').textContent=projects.find(p=>p.id===projectId)?.name??'Workspace';
    const threads=projectId?await api('/api/projects/'+projectId+'/conversations'):[];if(epoch!==generation)return;
    $('tasks').replaceChildren(...threads.map(t=>{const b=button('',()=>reset(t.id),'thread'+(selected===t.id?' selected':''));b.append(node('span',t.title),node('small',labels[t.status]??'New'));return b;}));
    if(!threads.length)$('tasks').append(node('p','Your conversations will appear here.','empty-list'));
    if(selected){const data=await api('/api/conversations/'+selected);if(epoch!==generation)return;latest=data.messages.at(-1);const next=JSON.stringify(data);if(next!==fingerprint){renderThread(data);fingerprint=next;}}
    else{$('thread-title').textContent='New conversation';latest=null;if(!fingerprint){empty();fingerprint='empty';}}
    $('rename').hidden=!selected;$('archive').hidden=!selected;
    const locked=latest&&(pending(latest.status)||latest.review==='pending');$('send').disabled=!!locked||uploading||!projectId;
    $('hint').textContent=locked?latest?.review==='pending'?'Review and commit or discard these changes before continuing.':'Approve or stop the current run before sending the next message.':'Each message waits for approval. Images and keyboard dictation are supported.';
  }catch(e){if(signedIn)notice(e.message);}finally{busy=false;if(epoch!==generation)refresh();}
}
$('loginform').onsubmit=async e=>{e.preventDefault();try{await api('/api/login',{key:$('key').value});$('key').value='';notice();await refresh();}catch(e){notice(e.message);}};
$('logout').onclick=async()=>{try{await api('/api/logout',{});signedIn=false;reset();projectId=null;$('workspace').hidden=true;$('login').hidden=false;}catch(e){notice(e.message);}};
$('new').onclick=()=>{reset();refresh();$('prompt').focus();};
$('add-project').onclick=()=>$('project-dialog').showModal();
$('project-close').onclick=()=>$('project-dialog').close();
$('project-form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const p=await api('/api/action',{op:'project-create',name:$('project-input').value});projectId=p.id;reset();$('project-dialog').close();$('project-input').value='';notice();await refresh();}catch(e){notice(e.message);}finally{b.disabled=false;}};
$('rename').onclick=async()=>{const name=prompt('Conversation name',$('thread-title').textContent);if(name===null)return;try{await api('/api/action',{op:'conversation-rename',id:selected,name});fingerprint='';await refresh();}catch(e){notice(e.message);}};
$('archive').onclick=async()=>{if(!confirm('Archive this conversation? Its runs and files will be kept.'))return;try{await api('/api/action',{op:'conversation-archive',id:selected});reset();await refresh();}catch(e){notice(e.message);}};
$('project-menu').onclick=()=>{const box=$('project-info');box.hidden=!box.hidden;const p=projects.find(p=>p.id===projectId);if(!p)return;box.replaceChildren(node('strong',p.name),node('p',p.repo,'path'),node('p','Local Git repository · Ask or Edit files, with approval before each run','muted'),button('Rename project',async()=>{const name=prompt('Project name',p.name);if(name===null)return;await api('/api/action',{op:'project-rename',id:p.id,name});box.hidden=true;}));};
$('voice').onclick=()=>{$('prompt').focus();notice('Use your keyboard microphone to dictate, then review your message before sending.');};
$('files').onchange=async()=>{const epoch=generation;uploading=true;$('send').disabled=true;try{const files=Array.from($('files').files);if(uploads.length+files.length>4)throw Error('Attach up to four images.');for(const file of files){if(file.size>5*1024*1024)throw Error('Each image must be at most 5 MB.');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const item=await api('/api/upload',{name:file.name,data});if(epoch!==generation)break;uploads.push(item);renderUploads();}}catch(e){notice(e.message);}finally{$('files').value='';uploading=false;refresh();}};
$('compose').onsubmit=async e=>{e.preventDefault();$('send').disabled=true;const epoch=generation;try{const t=await api('/api/action',{op:'create',project:projectId,conversation:selected,adapter:$('adapter').value,mode:$('mode').value,prompt:$('prompt').value,attachments:uploads.map(x=>x.id)});if(epoch===generation){reset(t.conversation);notice();}await refresh();}catch(e){notice(e.message);await refresh();}};
async function openReview(id){
  const value=await api('/api/tasks/'+id+'/review');reviewTask=id;reviewTree=value.tree;
  const content=$('review-content');content.replaceChildren(node('p',`${value.files.length} changed ${value.files.length===1?'file':'files'}`,'muted'),node('pre',value.summary,'path'));
  if(value.blocked.length)content.append(node('p','Sensitive filenames require manual resolution: '+value.blocked.join(', '),'error'));
  if(value.truncated)content.append(node('p','This diff is too large to approve here. Review and reduce it locally.','error'));
  const patch=node('pre',undefined,'diff');for(const line of value.patch.split('\n'))patch.append(node('span',line+'\n',line.startsWith('+')?'addition':line.startsWith('-')?'deletion':''));content.append(patch);
  content.append(node('h3','Checks'),node('p',value.checks?`${value.checks.status}${value.checks.tree!==value.tree?' · outdated for these changes':''}`:'Not run. Checks are required before committing.','muted'));
  if(value.checks?.output)content.append(node('pre',value.checks.output,'result'));
  const actions=$('review-actions');actions.replaceChildren();
  if(value.decision==='pending'){
    const check=button('Run checks',async()=>{await api('/api/action',{op:'validate',id,tree:value.tree});checking=id;actions.replaceChildren(button('Stop checks',()=>api('/api/action',{op:'cancel',id}),'danger'));notice('Checks are running. The result will appear here.');});actions.append(check);
    const commit=button('Approve commit',async()=>{const message=prompt('Commit message','Apply reviewed changes');if(message===null)return;await api('/api/action',{op:'commit',id,tree:value.tree,message});notice('Committed to a new local branch. Nothing was pushed.');await openReview(id);},'primary');
    commit.disabled=!value.files.length||value.truncated||!!value.blocked.length||value.checks?.status!=='passed'||value.checks?.tree!==value.tree;actions.append(commit);
    actions.append(button('Discard review',async()=>{if(!confirm('Continue without these changes? The worktree will be retained, but the next turn will not include these edits.'))return;await api('/api/action',{op:'discard',id});$('review-dialog').close();reviewTask=null;},'danger'));
  }else if(value.commit){content.append(node('p',`Committed on ${value.branch}`,'muted'),node('p',value.commit,'path'),node('p','Publishing to GitHub is not connected yet. The branch is saved locally.','muted'));}
  if(!$('review-dialog').open)$('review-dialog').showModal();
}
$('review-close').onclick=()=>{$('review-dialog').close();reviewTask=null;};
setInterval(async()=>{if(!checking)return;const id=checking;try{const data=await api('/api/tasks/'+id);const checks=JSON.parse(data.task.checks??'{}');if(checks.status!=='running'){checking=false;if(reviewTask===id)await openReview(id);notice();}}catch(e){checking=false;notice(e.message);}},2000);
notice();refresh();setInterval(()=>{if(signedIn&&!document.hidden)refresh();},3000);
