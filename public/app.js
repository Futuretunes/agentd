const $ = id => document.getElementById(id);
let projectId = null, selected = null, uploads = [], signedIn = false, busy = false, generation = 0;
let policy={editAdapters:[],enabledAdapters:['codex','claude']};
function renderAgents(){
  const box=$('adapter-info');box.replaceChildren(node('h2','Your agents'));
  for(const value of policy.adapters??[]){const item=node('div',undefined,'agent-availability');item.append(node('strong',value.name),node('p',value.available?'Available · '+value.modes.map(mode=>mode==='edit'?'Edit files':mode==='chat'?'Chat only':'Ask').join(' and '):value.reason,'muted'));if(value.available)item.append(node('p','Sign-in is checked when a run starts.','muted'));box.append(item);}
  box.append(node('p','Cursor integration is planned.','muted'));
}
function applyPolicy(){
  if(policy.adapters){
    const signature=JSON.stringify(policy.adapters.map(value=>[value.id,value.name]));
    if($('adapter').dataset.options!==signature){const selected=$('adapter').value;$('adapter').replaceChildren(...policy.adapters.map(value=>{const option=node('option',value.name);option.value=value.id;return option;}));$('adapter').value=selected;$('adapter').dataset.options=signature;}
  }
  for(const option of $('adapter').options)option.disabled=!policy.enabledAdapters.includes(option.value);
  if(!policy.enabledAdapters.includes($('adapter').value))$('adapter').value=policy.enabledAdapters[0]??'';
  const modes=policy.adapters?.find(a=>a.id===$('adapter').value)?.modes??['ask'];
  for(const option of $('mode').options)option.disabled=!modes.includes(option.value);
  if(!modes.includes($('mode').value))$('mode').value=modes[0]??'ask';
  const chat=$('mode').value==='chat';$('files').disabled=chat||submitting;$('files').closest('label').hidden=chat;
  $('mode').title=chat?'Text conversation only. No project files, terminal, editing, web browsing or plugins.':'';
  $('policy-hint').textContent=!policy.enabledAdapters.length?'No agents are available. Open Agents for details.':chat?'Chat only · text you send and prior conversation context · no project access or execution tools.':policy.strictWorkers?'Isolated workers · provider-only network access · approval required.':'Each message waits for approval before an agent starts.';
  if(!$('adapter-info').hidden)renderAgents();
}
$('agents-menu').onclick=()=>{$('adapter-info').hidden=!$('adapter-info').hidden;renderAgents();};
$('adapter').onchange=$('mode').onchange=()=>{applyPolicy();saveDraft();if(!selected)fingerprint='';void refresh();};
let reviewTask=null,reviewTree=null,checking=false;
let pageBefore=null,archivedView=false,submitting=false;
try{const location=JSON.parse(sessionStorage.getItem('agentd-draft-v1:location')??'null');if(location){projectId=location.project;selected=location.conversation;}}catch{}
let projects = [], latest = null, fingerprint = '', uploading = false, operationsBusy = false;
const draftPrefix='agentd-draft-v1:';let draftLocation=null;
function draftKey(){return projectId?draftPrefix+projectId+':'+(selected??'new'):null;}
function saveDraft(){
  if(!signedIn||!draftLocation)return;
  try{const value={text:$('prompt').value,uploads,adapter:$('adapter').value,mode:$('mode').value};if(value.text||value.uploads.length)sessionStorage.setItem(draftLocation,JSON.stringify(value));else sessionStorage.removeItem(draftLocation);$('draft-hint').textContent=value.text||value.uploads.length?'Draft saved in this browser tab. Cleared when you sign out.':'';}catch{$('draft-hint').textContent='Draft could not be saved in this browser. Keep this page open.';}
}
function restoreDraft(){
  if(!signedIn){draftLocation=null;return;}
  try{if(projectId)sessionStorage.setItem(draftPrefix+'location',JSON.stringify({project:projectId,conversation:selected}));}catch{}
  draftLocation=draftKey();if(!signedIn||!draftLocation)return;
  try{const value=JSON.parse(sessionStorage.getItem(draftLocation)??'null');if(value&&typeof value.text==='string'){$('prompt').value=value.text.slice(0,16000);uploads=Array.isArray(value.uploads)?value.uploads.slice(0,4):[];$('adapter').value=value.adapter;$('mode').value=value.mode;applyPolicy();renderUploads();$('draft-hint').textContent='Draft restored from this browser tab.';}else $('draft-hint').textContent='';}catch{$('draft-hint').textContent='';}
}
function forgetDraft(key){try{if(key)sessionStorage.removeItem(key);}catch{} }
function clearDrafts(){if($('github-content'))$('github-content').replaceChildren();for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();draftLocation=null;try{for(const key of Object.keys(sessionStorage))if(key.startsWith(draftPrefix))sessionStorage.removeItem(key);}catch{}$('prompt').value='';uploads=[];$('draft-hint').textContent='';}
$('prompt').addEventListener('input',saveDraft);window.addEventListener('pagehide',saveDraft);
const labels = {waiting_for_approval:'Ready for your approval',queued:'Queued',running:'Working',cancelling:'Stopping',cancelled:'Cancelled',succeeded:'Finished · review result',failed:'Failed',interrupted:'Interrupted',timed_out:'Time limit reached'};
const pending = status => ['waiting_for_approval','queued','running','cancelling'].includes(status);
function notice(text = '') { $('notice').textContent = text; $('notice').hidden = !text; }
function node(tag,text,cls) { const e = document.createElement(tag); if(text !== undefined)e.textContent=text; if(cls)e.className=cls; return e; }
async function api(path,data) {
  const res = await fetch(path,{method:data?'POST':'GET',headers:data?{'Content-Type':'application/json'}:undefined,body:data?JSON.stringify(data):undefined});
  const value=await res.json();
  if(res.status===401){clearDrafts();signedIn=false;for(const dialog of document.querySelectorAll('dialog[open]'))dialog.close();if($('account-content'))$('account-content').replaceChildren();$('workspace').hidden=true;$('login').hidden=false;}
  if(!res.ok)throw Error(value.error??'Request failed'); return value;
}
function button(text,callback,cls='') {
  const b=node('button',text,cls);b.type='button';b.onclick=async()=>{b.disabled=true;try{await callback();await refresh();}catch(e){notice(e.message);}finally{b.disabled=false;}};return b;
}
const relativeTime=value=>{const seconds=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/1000));if(seconds<60)return 'just now';if(seconds<3600)return Math.floor(seconds/60)+'m ago';if(seconds<86400)return Math.floor(seconds/3600)+'h ago';return Math.floor(seconds/86400)+'d ago';};
function operationTask(item){
  const card=node('article',undefined,'operation-task'),head=node('div',undefined,'message-head');head.append(node('strong',item.conversationTitle),node('span',labels[item.status]??item.status,'status '+item.status));card.append(head,node('p',`${item.projectName} · ${item.adapter==='codex'?'Codex':'Claude'} · ${item.mode==='edit'?'Edit files':item.mode==='chat'?'Chat only':'Ask'} · ${relativeTime(item.updated)}`,'muted'));
  if(item.error)card.append(node('p',item.error==='Exit 1'?'The agent stopped with an error. Open the conversation for details.':item.error,'error'));
  if(item.review==='pending')card.append(node('p','Changes are waiting for review.','attention'));
  if(item.checkStatus)card.append(node('p','Checks: '+item.checkStatus,'muted'));
  card.append(button(['failed','timed_out','interrupted','cancelled'].includes(item.status)?'Open & recover':'Open conversation',async()=>{saveDraft();projectId=item.project;reset(item.conversation);$('operations-dialog').close();await refresh();}));return card;
}
function renderOperations(data){
  const content=$('operations-content');content.replaceChildren();
  const active=(data.counts.waiting_for_approval??0)+(data.counts.queued??0)+(data.counts.running??0)+(data.counts.cancelling??0),problems=(data.counts.failed??0)+(data.counts.timed_out??0)+(data.counts.interrupted??0);
  const summary=node('section',undefined,'operation-summary');for(const [value,label] of [[active,'Active or waiting'],[data.counts.succeeded??0,'Completed'],[problems,'Need attention'],[data.service.queueDepth,'Queued']]){const card=node('div',undefined,'metric-card');card.append(node('strong',String(value)),node('span',label));summary.append(card);}content.append(summary);if(data.service.dependencySetup)content.append(node('p','Dependencies are being prepared. Task starts wait until preparation finishes.','attention'));
  const service=node('section',undefined,'operation-section');service.append(node('h3','Service'),node('p',`Healthy · ${data.service.scheduler} scheduler · ${data.service.security} workers`,'good'),node('p',data.service.activeTask?'An agent is currently working.':'No agent is currently running.','muted'));content.append(service);
  const agents=node('section',undefined,'operation-section');agents.append(node('h3','Agents and usage'));
  for(const value of data.adapters){const card=node('div',undefined,'operation-agent'),account=value.account??{state:'checking',message:'Checking account status'};card.append(node('strong',value.name),node('p',account.state==='signed_in'?`Signed in${account.method?' · '+account.method:''}`:account.message,account.state==='signed_in'?'good':account.state==='signed_out'?'attention':'muted'),node('p',value.available?'Available · '+value.modes.map(mode=>mode==='edit'?'Edit files':mode==='chat'?'Chat only':'Ask').join(' and '):value.reason,'muted'),node('p',value.usage.message,'muted'));
    const actions=node('div',undefined,'actions');
    if(value.renewal)card.append(node('p',value.renewal.message,value.renewal.state==='reconnect_required'?'attention':'muted'));
    const login=button(account.state==='signed_in'?'Reconnect account':'Sign in',()=>startAccount(value.id,'login'));login.disabled=!value.installed||!!data.service.activeTask||data.service.queueDepth>0||data.service.accountChange||data.service.renewing;actions.append(login);
    if(account.state==='signed_in'){const logout=button('Sign out',async()=>{if(confirm('Sign out of '+value.name+' on this server? Future runs will need a new login.'))await startAccount(value.id,'logout');},'danger');logout.disabled=login.disabled;actions.append(logout);}
    card.append(actions);agents.append(card);
  }
  agents.append(button('Refresh account status',()=>api('/api/account',{action:'refresh'})));
  if(data.service.renewing)agents.append(node('p','Renewing the account before the next approved run.','muted'));
  if(data.service.accountChange)agents.append(node('p','An account change is in progress. Work resumes when it finishes.','attention'),button('View sign-in',()=>showAccount()));
  else if(data.service.activeTask||data.service.queueDepth>0)agents.append(node('p','Finish or stop current work before changing accounts.','muted'));
  content.append(agents);
  const current=data.tasks.filter(item=>pending(item.status)||item.review==='pending'),attention=data.tasks.filter(item=>['failed','timed_out','interrupted'].includes(item.status)),recent=data.tasks.filter(item=>!pending(item.status)&&item.review!=='pending'&&!['failed','timed_out','interrupted'].includes(item.status)).slice(0,10);
  for(const [title,items,emptyText] of [['Current work',current,'Nothing is waiting or running.'],['Needs attention',attention,'No recent failures need attention.'],['Recent work',recent,'No completed work yet.']]){const section=node('section',undefined,'operation-section');section.append(node('h3',title));if(items.length)section.append(...items.map(operationTask));else section.append(node('p',emptyText,'muted'));content.append(section);}
  content.append(node('p','Updated '+new Date(data.generatedAt).toLocaleTimeString()+'. Account status is cached; usage appears only when a native provider exposes it reliably.','hint'));
}
async function loadOperations(show=true){if(operationsBusy)return;operationsBusy=true;try{if(show&&!$('operations-dialog').open)$('operations-dialog').showModal();if(show)$('operations-content').replaceChildren(node('p','Loading workspace status…','muted'));renderOperations(await api('/api/operations'));}catch(e){notice(e.message);if(show)$('operations-dialog').close();}finally{operationsBusy=false;}}
$('operations-menu').onclick=()=>loadOperations();
$('operations-close').onclick=()=>$('operations-dialog').close();
const accountDialog=node('dialog');accountDialog.id='account-dialog';accountDialog.setAttribute('aria-labelledby','account-heading');
const accountHead=node('div',undefined,'review-head'),accountHeading=node('h2','Connect your account');accountHeading.id='account-heading';
const accountClose=node('button','×');accountClose.type='button';accountClose.setAttribute('aria-label','Close account dialog');accountClose.onclick=()=>{accountDialog.close();$('account-content').replaceChildren();};accountHead.append(accountHeading,accountClose);
const accountContent=node('div');accountContent.id='account-content';accountDialog.append(accountHead,accountContent);document.body.append(accountDialog);
let accountFingerprint='',accountPolling=false;
accountDialog.addEventListener('close',()=>{accountContent.replaceChildren();accountFingerprint='';});
async function startAccount(adapter,operation){await api('/api/account',{action:'start',adapter,operation});await showAccount();}
async function showAccount(){accountFingerprint='';if(!accountDialog.open)accountDialog.showModal();await updateAccount();}
async function updateAccount(){
  if(accountPolling||!accountDialog.open)return;accountPolling=true;
  try{
    const value=await api('/api/account'),s=value.session,signature=JSON.stringify(value);if(signature===accountFingerprint)return;accountFingerprint=signature;accountContent.replaceChildren();
    if(!s){accountContent.append(node('p',value.busy?'Account setup is open in another browser. Return there or wait for it to expire.':'No sign-in is in progress. Open Operations to start.','muted'));return;}
    accountHeading.textContent=(s.adapter==='claude'?'Claude':'Codex')+' account';
    accountContent.append(node('p',s.message,s.state==='succeeded'?'good':s.state==='failed'||s.state==='expired'?'error':'muted'));
    if(s.url){const link=node('a','Open '+(s.adapter==='claude'?'Claude':'OpenAI')+' sign-in','provider-login');link.href=s.url;link.target='_blank';link.rel='noopener noreferrer';accountContent.append(link);}
    if(s.code){accountContent.append(node('p','Enter this one-time code on the provider page:','muted'),node('code',s.code,'device-code'));}
    if(s.needsCode){
      const form=node('form'),label=node('label','Code returned by Claude'),input=node('input');label.htmlFor='account-code';input.id='account-code';input.type='password';input.autocomplete='off';input.maxLength=4096;input.required=true;input.spellcheck=false;
      const submit=node('button','Complete sign-in','primary');submit.type='submit';form.append(label,input,submit);
      form.onsubmit=async event=>{event.preventDefault();submit.disabled=true;const code=input.value.trim();input.value='';try{await api('/api/account',{action:'code',session:s.id,code});accountFingerprint='';await updateAccount();}catch(e){notice(e.message);}finally{submit.disabled=false;}};accountContent.append(form);
    }
    if(!['succeeded','failed','cancelled','expired'].includes(s.state)){accountContent.append(node('p','Finish before '+new Date(s.expiresAt).toLocaleTimeString()+'. Passwords belong only on the provider website.','hint'),button('Cancel sign-in',async()=>{await api('/api/account',{action:'cancel',session:s.id});await updateAccount();}));}
    else accountContent.append(button('Back to Operations',async()=>{accountDialog.close();accountContent.replaceChildren();await loadOperations();}));
  }catch(e){accountContent.replaceChildren(node('p',e.message,'error'));}finally{accountPolling=false;}
}
setInterval(()=>{if(signedIn&&!document.hidden&&accountDialog.open)void updateAccount();},1500);
function reset(thread=null) { saveDraft();selected=thread;pageBefore=null;archivedView=false;generation++;fingerprint='';latest=null;draftLocation=null;uploads=[];renderUploads();$('prompt').value='';$('project-info').hidden=true;$('draft-hint').textContent='';restoreDraft(); }
function renderUploads(){ saveDraft();$('attachments').replaceChildren(...uploads.map(item=>button(item.name+' ×',()=>{uploads=uploads.filter(x=>x.id!==item.id);renderUploads();}))); }
function images(items){const box=node('div',undefined,'images');for(const item of items){const a=node('a');a.href='/api/images/'+item.id;a.target='_blank';a.rel='noopener';const img=node('img');img.src=a.href;img.alt=item.name;a.append(img);box.append(a);}return box;}
function empty(){
  const d=$('detail');d.replaceChildren();const intro=node('div',undefined,'welcome');intro.append(node('div','◈','welcome-icon'),node('p',projects.find(p=>p.id===projectId)?.name??'Your workspace','eyebrow'),node('h2','What shall we work on?'),node('p','Start a conversation. Choose an agent. You decide when it runs.','muted'));
  const ideas=node('div',undefined,'suggestions');for(const text of ($('mode').value==='chat'?['Help me think through a design','Explain a concept','Review text I paste here']:['Explain this project','Review the architecture','Plan the next milestone']))ideas.append(button(text,()=>{$('prompt').value=text;saveDraft();$('prompt').focus();}));intro.append(ideas);d.append(intro);
}
function renderThread(data){
  $('thread-title').textContent=data.conversation.title;
  const d=$('detail'),nearBottom=d.scrollHeight-d.scrollTop-d.clientHeight<120;d.replaceChildren();
  for(const t of data.messages){
    const turn=node('article',undefined,'turn');const user=node('div',undefined,'user-message');user.append(node('div',t.prompt,'message-text'),images(t.images??[]));turn.append(user);
    const response=node('div',undefined,'agent-message');const head=node('div',undefined,'message-head');head.append(node('strong',t.adapter==='codex'?'◈ Codex':'✳ Claude'),node('span',labels[t.status]??t.status,'status '+t.status));response.append(head);
    if(t.outputTruncated)response.append(node('p','Showing the latest output. Open Run activity to download a larger excerpt.','muted'));
    if(t.output)response.append(node('pre',t.output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g,''),'result'));else response.append(node('p',t.status==='waiting_for_approval'?t.mode==='edit'?'This run may edit files in its worktree. Review your message, then approve.':'Review your message, then approve this run.':pending(t.status)?'Your agent’s output will appear here.':'No output was recorded.','muted'));
    if(t.error)response.append(node('p',t.error,'error'));
    if(t.mode==='chat')response.append(node('p','Chat only · no project access or execution tools','muted'));
    if(t.retry_of)response.append(node('p','New attempt of an earlier run · original inputs and revision retained.','muted'));
    const actions=node('div',undefined,'actions');if(t.status==='waiting_for_approval'){actions.append(button('Approve & run',()=>api('/api/action',{op:'approve',id:t.id}),'primary'),button('Reject',()=>api('/api/action',{op:'cancel',id:t.id})));}
    else if(['queued','running'].includes(t.status))actions.append(button('Stop run',()=>api('/api/action',{op:'cancel',id:t.id}),'danger'));
    if(t.mode==='edit'){response.append(node('p','Edit files · '+(t.review??'changes require a separate review'),'muted'));if(t.worktree&&!pending(t.status))actions.append(button(t.review==='committed'?'View committed changes':'Review changes',()=>openReview(t.id)));}
    if(!pageBefore&&!archivedView&&t.id===data.messages.at(-1)?.id&&['failed','timed_out','interrupted','cancelled'].includes(t.status)){
      const reason=t.status==='timed_out'?'This run reached its time limit. A retry starts over with the same limit.':t.status==='interrupted'?'The service stopped before the run finished.':t.status==='cancelled'?'This run was stopped.':'The agent could not complete this run. Check its output above; reconnect in Operations if it reports a sign-in problem.';
      response.append(node('p',reason,'attention'));
      if(t.review==='pending')response.append(node('p','Review any partial changes first. Commit them and send a follow-up, or discard the review to retry from the original revision. The old files are retained.','muted'));
      else if(t.commit_sha)response.append(node('p','Changes from this run are committed. Send a follow-up to continue from them.','muted'));
      else{
        const retry=button('Retry run',async()=>{
          if(!confirm('Create a new attempt with the same prompt, images and original revision? Partial edits will not be copied. You will approve it before it runs.'))return;
          await api('/api/action',{op:'retry',id:t.id});fingerprint='';notice('New attempt ready. Review it, then approve when you are ready.');
        });
        const supported=policy.enabledAdapters.includes(t.adapter)&&(t.mode!=='edit'||policy.editAdapters.includes(t.adapter));retry.disabled=!supported;actions.append(retry);
        if(!supported)response.append(node('p','This agent or work mode is unavailable. Open Agents for the reason.','muted'));
      }
      actions.append(button('Account status',()=>loadOperations()));
    }
    actions.append(button('Run activity',()=>openRun(t.id)));
    response.append(actions);const meta=node('details');meta.append(node('summary','Run details'),node('p',`Revision ${t.revision.slice(0,12)} · ${new Date(t.created).toLocaleString()}`,'muted'),node('p',t.worktree??'A worktree will be created after approval.','path'));response.append(meta);turn.append(response);d.append(turn);
  }
  const pages=node('div',undefined,'actions history-navigation');if(data.olderBefore)pages.append(button('Earlier turns',()=>{pageBefore=data.olderBefore;fingerprint='';}));if(pageBefore)pages.append(button('Latest turns',()=>{pageBefore=null;fingerprint='';}));if(pages.childNodes.length)d.prepend(pages);
  if(nearBottom||!fingerprint)d.scrollTop=d.scrollHeight;
}
async function refresh(){
  if(busy)return;busy=true;const epoch=generation;
  try{
    const capabilities=await api('/api/capabilities');policy={editAdapters:capabilities.editAdapters??[],enabledAdapters:capabilities.enabledAdapters??['codex','claude'],strictWorkers:capabilities.strictWorkers,adapters:capabilities.adapters};applyPolicy();
    const list=await api('/api/projects');if(epoch!==generation)return;projects=list;
    signedIn=true;$('login').hidden=true;$('workspace').hidden=false;
    if(!selected&&!projects.some(p=>p.id===projectId))projectId=projects[0]?.id??null;
    $('projects').replaceChildren(...projects.map(p=>{const b=button('',()=>{saveDraft();projectId=p.id;reset();},'project'+(p.id===projectId?' selected':''));b.append(node('span','▱ '+p.name),node('small',String(p.conversations)));return b;}));
    $('project-name').textContent=projects.find(p=>p.id===projectId)?.name??'Workspace';
    const threads=projectId?await api('/api/projects/'+projectId+'/conversations'):[];if(epoch!==generation)return;
    $('tasks').replaceChildren(...threads.map(t=>{const b=button('',()=>reset(t.id),'thread'+(selected===t.id?' selected':''));b.append(node('span',t.title),node('small',labels[t.status]??'New'));return b;}));
    if(!threads.length)$('tasks').append(node('p','Your conversations will appear here.','empty-list'));
    if(draftLocation!==draftKey()){saveDraft();$('prompt').value='';uploads=[];restoreDraft();renderUploads();}
    if(selected){const data=await api('/api/conversations/'+selected+(pageBefore?'?before='+pageBefore:''));if(epoch!==generation)return;archivedView=!!data.conversation.archived||!!data.project.archived;$('project-name').textContent=data.project.name;latest=data.messages.at(-1);const next=JSON.stringify(data);if(next!==fingerprint){renderThread(data);fingerprint=next;}}
    else{archivedView=false;$('thread-title').textContent='New conversation';latest=null;if(!fingerprint){empty();fingerprint='empty';}}
    $('rename').hidden=!selected;$('archive').hidden=!selected;
    const locked=latest&&(pending(latest.status)||latest.review==='pending');$('send').disabled=submitting||!!pageBefore||archivedView||!!locked||uploading||!projectId||!policy.enabledAdapters.length;
    $('hint').textContent=archivedView?'This conversation is archived. Restore it through History to continue.':pageBefore?'Viewing earlier turns. Return to the latest turns to continue.':locked?latest?.review==='pending'?'Review and commit or discard these changes before continuing.':'Approve or stop the current run before sending the next message.':$('mode').value==='chat'?'Text only · paste any context you want to discuss. Each message waits for approval.':'Each message waits for approval. Images and keyboard dictation are supported.';
    if($('operations-dialog').open)void loadOperations(false);
  }catch(e){if(signedIn)notice(e.message);}finally{busy=false;if(epoch!==generation)refresh();}
}
$('loginform').onsubmit=async e=>{e.preventDefault();try{await api('/api/login',{key:$('key').value});$('key').value='';notice();await refresh();}catch(e){notice(e.message);}};
$('logout').onclick=async()=>{try{await api('/api/logout',{});clearDrafts();signedIn=false;reset();projectId=null;$('workspace').hidden=true;$('login').hidden=false;}catch(e){notice(e.message);}};
$('new').onclick=()=>{reset();refresh();$('prompt').focus();};
$('add-project').onclick=()=>$('project-dialog').showModal();
$('project-close').onclick=()=>$('project-dialog').close();
$('project-form').onsubmit=async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;try{const p=await api('/api/action',{op:'project-create',name:$('project-input').value});saveDraft();projectId=p.id;reset();$('project-dialog').close();$('project-input').value='';notice();await refresh();}catch(e){notice(e.message);}finally{b.disabled=false;}};
$('rename').onclick=async()=>{const name=prompt('Conversation name',$('thread-title').textContent);if(name===null)return;try{await api('/api/action',{op:'conversation-rename',id:selected,name});fingerprint='';await refresh();}catch(e){notice(e.message);}};
$('archive').onclick=async()=>{if(!confirm('Archive this conversation? Its runs and files will be kept.'))return;try{await api('/api/action',{op:'conversation-archive',id:selected});reset();await refresh();}catch(e){notice(e.message);}};
$('project-menu').onclick=()=>{const box=$('project-info');box.hidden=!box.hidden;const p=projects.find(p=>p.id===projectId);if(!p)return;box.replaceChildren(node('strong',p.name),node('p',p.repo,'path'),node('p','Local Git repository · Ask or Edit files, with approval before each run','muted'),...(p.github_url?[node('p',p.github_url+' · '+p.github_branch,'path'),button('Pull updates',async()=>{if(!confirm('Update this project from its GitHub branch? Only clean, forward updates are allowed. Existing conversations keep their pinned revision; start a new conversation to use updated files.'))return;await api('/api/repositories',{action:'start',kind:'update',project:p.id});$('repository-dialog').showModal();await updateRepositories();})]:[]),button('Set up checks',()=>openCheckSetup(p.id)),button('Rename project',async()=>{const name=prompt('Project name',p.name);if(name===null)return;await api('/api/action',{op:'project-rename',id:p.id,name});box.hidden=true;}),button('Archive project',async()=>{if(!confirm('Archive this project and hide its conversations? Files and history will be kept. You can restore it in History.'))return;await api('/api/action',{op:'project-archive',id:p.id});saveDraft();projectId=null;reset();box.hidden=true;}));};
$('voice').onclick=()=>{$('prompt').focus();notice('Use your keyboard microphone to dictate, then review your message before sending.');};
$('files').onchange=async()=>{const epoch=generation;uploading=true;$('send').disabled=true;try{const files=Array.from($('files').files);if(uploads.length+files.length>4)throw Error('Attach up to four images.');for(const file of files){if(file.size>5*1024*1024)throw Error('Each image must be at most 5 MB.');const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(file);});const item=await api('/api/upload',{name:file.name,data});if(epoch!==generation)break;uploads.push(item);renderUploads();}}catch(e){notice(e.message);}finally{$('files').value='';uploading=false;refresh();}};
$('compose').onsubmit=async e=>{e.preventDefault();if(submitting||pageBefore||archivedView)return;submitting=true;$('prompt').disabled=true;$('send').disabled=true;applyPolicy();const epoch=generation;const submittedDraft=draftLocation;try{const t=await api('/api/action',{op:'create',project:projectId,conversation:selected,adapter:$('adapter').value,mode:$('mode').value,prompt:$('prompt').value,attachments:uploads.map(x=>x.id)});forgetDraft(submittedDraft);if(epoch===generation){draftLocation=null;reset(t.conversation);notice();}await refresh();}catch(e){notice(e.message);}finally{submitting=false;$('prompt').disabled=false;applyPolicy();await refresh();}};
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
    actions.append(button('Set up checks',()=>openCheckSetup(value.project,id)));
    const check=button('Run checks',async()=>{await api('/api/action',{op:'validate',id,tree:value.tree});checking=id;actions.replaceChildren(button('Stop checks',()=>api('/api/action',{op:'cancel',id}),'danger'));notice('Checks are running. The result will appear here.');});actions.append(check);
    const commit=button('Approve commit',async()=>{const message=prompt('Commit message','Apply reviewed changes');if(message===null)return;await api('/api/action',{op:'commit',id,tree:value.tree,message});notice('Committed to a new local branch. Nothing was pushed.');await openReview(id);},'primary');
    commit.disabled=!value.files.length||value.truncated||!!value.blocked.length||value.checks?.status!=='passed'||value.checks?.tree!==value.tree;actions.append(commit);
    actions.append(button('Discard review',async()=>{if(!confirm('Continue without these changes? The worktree will be retained, but the next turn will not include these edits.'))return;await api('/api/action',{op:'discard',id});$('review-dialog').close();reviewTask=null;},'danger'));
  }else if(value.commit){content.append(node('p',`Committed on ${value.branch}`,'muted'),node('p',value.commit,'path'),button('Publish to GitHub',()=>openPublishing(id,value.project)));}
  if(!$('review-dialog').open)$('review-dialog').showModal();
}
$('review-close').onclick=()=>{$('review-dialog').close();reviewTask=null;};
setInterval(async()=>{if(!checking)return;const id=checking;try{const data=await api('/api/tasks/'+id);const checks=JSON.parse(data.task.checks??'{}');if(checks.status!=='running'){checking=false;if(reviewTask===id)await openReview(id);notice();}}catch(e){checking=false;notice(e.message);}},2000);
let historyEpoch=0,historyCursor=null;
async function loadHistory(before=null){
  const epoch=++historyEpoch,query=$('history-query').value,filter=$('history-filter').value;
  $('history-results').replaceChildren(node('p','Searching…','muted'));$('history-pages').replaceChildren();
  try{const [result,archived]=await Promise.all([api('/api/history?q='+encodeURIComponent(query)+'&filter='+filter+(before?'&before='+before:'')),api('/api/archived-projects')]);if(epoch!==historyEpoch||!$('history-dialog').open)return;
    $('history-results').replaceChildren();for(const item of result.items){const card=node('article',undefined,'operation-task');card.append(node('strong',item.title),node('p',item.projectName+' · '+(labels[item.status]??'New')+(item.archived||item.projectArchived?' · Archived':''),'muted'));const actions=node('div',undefined,'actions');actions.append(button('Open',()=>{saveDraft();projectId=item.project;reset(item.id);$('history-dialog').close();}));
      if(item.projectArchived)actions.append(button('Restore project',async()=>{await api('/api/action',{op:'project-restore',id:item.project});await loadHistory(before);}));
      else if(item.archived)actions.append(button('Restore conversation',async()=>{await api('/api/action',{op:'conversation-restore',id:item.id});await loadHistory(before);}));card.append(actions);$('history-results').append(card);}
    if(!result.items.length)$('history-results').append(node('p','No conversations match this search.','muted'));
    historyCursor=result.next;$('history-pages').replaceChildren();if(before)$('history-pages').append(button('Newest results',()=>loadHistory()));if(historyCursor)$('history-pages').append(button('More results',()=>loadHistory(historyCursor)));
    $('archived-projects').replaceChildren();if(filter!=='active'&&archived.length){$('archived-projects').append(node('h3','Archived projects'));for(const p of archived)$('archived-projects').append(button('Restore '+p.name,async()=>{await api('/api/action',{op:'project-restore',id:p.id});await loadHistory();}));}
  }catch(e){if(epoch===historyEpoch)$('history-results').replaceChildren(node('p',e.message,'error'));}
}
$('history-menu').onclick=()=>{$('history-dialog').showModal();void loadHistory();};$('history-close').onclick=()=>{$('history-dialog').close();historyEpoch++;};$('history-form').onsubmit=e=>{e.preventDefault();void loadHistory();};$('history-filter').onchange=()=>loadHistory();
let runId=null,runBusy=false,runFingerprint='';
async function openRun(id){runId=id;runFingerprint='';$('run-dialog').showModal();$('run-content').replaceChildren(node('p','Loading activity…','muted'));await updateRun();}
async function updateRun(){if(runBusy||!runId||!$('run-dialog').open)return;runBusy=true;const id=runId;try{const data=await api('/api/tasks/'+id);if(runId!==id||!$('run-dialog').open)return;const signature=JSON.stringify(data);if(signature===runFingerprint)return;runFingerprint=signature;
 const box=$('run-content');box.replaceChildren(node('p',labels[data.task.status]??data.task.status,'status '+data.task.status));const timeline=node('ol',undefined,'run-timeline');for(const event of data.events){const row=node('li');row.append(node('strong',labels[event.status]??event.status),node('span',new Date(event.at).toLocaleString(),'muted'));timeline.append(row);}box.append(timeline);
 if(data.task.error)box.append(node('p',data.task.error,'error'));box.append(node('h3','Latest output'),node('p','The live view shows up to 60 KB. Downloads contain the latest 512 KB and identify omitted output.','muted'),node('pre',data.output||'No output recorded yet.','result'));
 const link=node('a','Download latest output','output-download');link.href='/api/tasks/'+id+'/output';link.download='agentd-'+id+'.txt';box.append(link);if(['queued','running'].includes(data.task.status))box.append(button('Stop run',()=>api('/api/action',{op:'cancel',id}),'danger'));
 }catch(e){if(runId===id)$('run-content').replaceChildren(node('p',e.message,'error'));}finally{runBusy=false;}}
$('run-close').onclick=()=>{$('run-dialog').close();runId=null;};setInterval(()=>{if(signedIn&&!document.hidden)void updateRun();},2000);
notice();refresh();setInterval(()=>{if(signedIn&&!document.hidden)refresh();},3000);

let repositorySource=null,repositoryRendered='',repositoryPolling=false,githubRendered='',githubPolling=false;
$('import-open').onclick=()=>{$('project-dialog').close();$('repository-dialog').showModal();void updateRepositories();};
$('repository-close').onclick=()=>$('repository-dialog').close();
$('repository-url').oninput=()=>{repositorySource=null;$('repository-import').hidden=true;};
async function repositorySubmit(e,input){e.preventDefault();const b=e.submitter;b.disabled=true;try{await api('/api/repositories',{action:'start',...input});repositoryRendered='';await updateRepositories();}catch(e){notice(e.message);}finally{b.disabled=false;}}
$('repository-form').onsubmit=e=>{repositorySource=null;$('repository-import').hidden=true;void repositorySubmit(e,{kind:'inspect',url:$('repository-url').value});};
$('repository-import').onsubmit=e=>void repositorySubmit(e,{kind:'import',url:repositorySource,branch:$('repository-branch').value,name:$('repository-name').value});
async function updateRepositories(){
 if(repositoryPolling||!$('repository-dialog').open||!signedIn)return;repositoryPolling=true;
 try{const jobs=await api('/api/repositories');if(!$('repository-dialog').open)return;const signature=JSON.stringify(jobs);if(signature===repositoryRendered)return;repositoryRendered=signature;const box=$('repository-status');box.replaceChildren();
 for(const job of jobs){const item=node('section');item.append(node('strong',({inspect:'Find branches',import:'Import project',update:'Pull updates'}[job.kind]??job.kind)+' · '+({running:'In progress',succeeded:'Complete',failed:'Failed',cancelled:'Cancelled',interrupted:'Interrupted'}[job.state]??job.state)),node('p',job.source+(job.branch?' · '+job.branch:''),'path'));if(job.error)item.append(node('p',job.error));
 if(job.state==='running')item.append(button('Cancel operation',async()=>{await api('/api/repositories',{action:'cancel',job:job.id});repositoryRendered='';await updateRepositories();}));
 if(job.kind==='inspect'&&job.state==='succeeded'&&job.source===$('repository-url').value.trim().toLowerCase().replace(/\/$/,'').replace(/(?:\.git)?$/,'.git')&&repositorySource!==job.source){repositorySource=job.source;$('repository-branch').replaceChildren(...job.result.branches.map(b=>{const o=node('option',b);o.value=b;return o;}));$('repository-branch').value=job.result.defaultBranch;$('repository-name').value=job.source.split('/').pop().replace(/\.git$/,'');$('repository-import').hidden=false;}
 if(job.kind==='import'&&job.state==='succeeded')item.append(button('Open project',async()=>{saveDraft();projectId=job.result.project;reset();$('repository-dialog').close();await refresh();}));
 if(job.kind==='update'&&job.state==='succeeded')item.append(node('p',job.result.changed?'Updated. Start a new conversation to use the latest files.':'Already up to date.'));box.append(item);}
 }catch(e){notice(e.message);}finally{repositoryPolling=false;}
}
$('github-open').onclick=()=>{$('github-dialog').showModal();githubRendered='';void updateGithub();};$('github-close').onclick=()=>{$('github-dialog').close();$('github-content').replaceChildren();githubRendered='';};
async function githubAction(action,session){await api('/api/github',{action,session});githubRendered='';await updateGithub();}
async function updateGithub(){if(githubPolling||!$('github-dialog').open||!signedIn)return;githubPolling=true;try{const data=await api('/api/github');if(!$('github-dialog').open)return;const signature=JSON.stringify(data);if(signature===githubRendered)return;githubRendered=signature;const box=$('github-content');box.replaceChildren(node('p',data.connected?'A GitHub connection is saved. Importing verifies repository access.':'No GitHub connection saved.'));const session=data.session;if(session){box.append(node('p',session.message));if(session.code){const link=node('a','Open GitHub');link.href=session.url;link.target='_blank';link.rel='noopener noreferrer';box.append(node('pre',session.code),link);}if(data.busy)box.append(button('Cancel sign-in',()=>githubAction('cancel',session.id)));}else if(data.busy)box.append(node('p','Sign-in is in progress in another browser.'));
 if(!data.installed)box.append(node('p','GitHub CLI is unavailable. Install the repository-import release on the server.'));else if(!data.busy){box.append(button(data.connected?'Reconnect GitHub':'Connect GitHub',()=>githubAction('start')));if(data.connected)box.append(button('Disconnect',async()=>{if(confirm('Remove the GitHub connection saved on this server? Existing projects remain available.'))await githubAction('logout');}));}
 }catch(e){notice(e.message);}finally{githubPolling=false;}}
setInterval(()=>{if(signedIn&&!document.hidden){void updateRepositories();void updateGithub();}},1500);

let setupTarget=null,setupPolling=false,setupSignature='';
async function openCheckSetup(project,task){setupTarget={project,task};setupSignature='';$('check-setup-dialog').showModal();await updateCheckSetup();}
$('check-setup-close').onclick=()=>{$('check-setup-dialog').close();setupTarget=null;};
async function updateCheckSetup(){if(setupPolling||!setupTarget||!signedIn||!$('check-setup-dialog').open)return;setupPolling=true;const target=setupTarget;try{const value=await api('/api/check-setup?project='+encodeURIComponent(target.project)+(target.task?'&task='+encodeURIComponent(target.task):''));if(setupTarget!==target||!$('check-setup-dialog').open)return;const signature=JSON.stringify(value);if(signature===setupSignature)return;setupSignature=signature;const box=$('check-setup-content');box.replaceChildren(node('p',target.task?'Setup for the edits currently awaiting review.':'Setup for this project’s current checkout.','muted'));if(value.error)box.append(node('p',value.error));if(value.plan){box.append(node('p',value.plan.ready?'Dependencies are ready for these exact project files.':value.plan.legacy?'An administrator-prepared dependency set is available. You can keep using it or prepare a GUI-managed set.':'Dependencies need preparation.'),node('p',value.plan.packages+' locked packages · npm checks'),node('h3','Commands you will approve separately when running checks'));for(const [name,script] of Object.entries(value.plan.scripts))box.append(node('strong',name),node('pre',script,'diff'));box.append(node('p','Preparation downloads public npm packages in isolation. Install scripts are disabled. No account credentials or other projects are available. Limit: 512 MB and four minutes; private packages and workspaces are unsupported. Checks run later without network access; pre/post hooks are disabled.','muted'));const prepare=button(value.plan.ready?'Prepare again':'Approve dependency preparation',async()=>{if(!confirm('Download the locked public npm packages for these exact files? Install scripts will not run.'))return;await api('/api/check-setup',{action:'prepare',...target,fingerprint:value.plan.fingerprint});setupSignature='';await updateCheckSetup();});prepare.disabled=value.busy;box.append(prepare);if(value.plan.ready&&target.task)box.append(button('Back to review',async()=>{$('check-setup-dialog').close();setupTarget=null;await openReview(target.task);}));}
 for(const job of value.jobs){const item=node('section');item.append(node('strong',({running:'Preparing dependencies…',succeeded:'Dependencies prepared',failed:'Preparation failed',cancelled:'Preparation cancelled',interrupted:'Preparation interrupted'}[job.state]??job.state)));if(job.error)item.append(node('p',job.error));if(job.state==='running')item.append(button('Cancel preparation',async()=>{await api('/api/check-setup',{action:'cancel',id:job.id});setupSignature='';await updateCheckSetup();}));box.append(item);}if(value.busy&&!value.jobs.some(j=>j.state==='running'))box.append(node('p','Another project is preparing dependencies.'));
 }catch(e){notice(e.message);}finally{setupPolling=false;}}
setInterval(()=>{if(!document.hidden)void updateCheckSetup();},1500);

let publishingTask=null,publishingPolling=false,publishingSignature='';
async function openPublishing(task,project){publishingTask=task;publishingSignature='';$('publishing-base').value=projects.find(p=>p.id===project)?.github_branch??'main';$('publishing-title').value='Apply reviewed changes';$('publishing-body').value='';$('publishing-content').replaceChildren();$('publishing-dialog').showModal();await updatePublishing();}
$('publishing-close').onclick=()=>{$('publishing-dialog').close();publishingTask=null;};
$('publishing-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;button.disabled=true;try{await api('/api/publishing',{action:'preview',task:publishingTask,base:$('publishing-base').value.trim(),title:$('publishing-title').value,body:$('publishing-body').value});publishingSignature='';await updatePublishing();}catch(e){$('publishing-content').replaceChildren(node('p',e.message,'error'));}finally{button.disabled=false;}};
async function updatePublishing(){if(publishingPolling||!publishingTask||!signedIn||!$('publishing-dialog').open)return;publishingPolling=true;const task=publishingTask;try{const jobs=await api('/api/publishing?task='+encodeURIComponent(task));if(task!==publishingTask||!$('publishing-dialog').open)return;const signature=JSON.stringify(jobs);if(signature===publishingSignature)return;publishingSignature=signature;const box=$('publishing-content');box.replaceChildren();const job=jobs[0];if(!job){box.append(node('p','Connect GitHub through Import from GitHub → GitHub connection first. This project needs a GitHub HTTPS origin and reviewed commits based on the current target branch.','muted'));return;}
 box.append(node('h3',({preparing:'Preparing preview…',ready:'Ready for your approval',publishing:'Verifying publication…',pushing:'Publishing branch…',branch_published:'Branch published; preparing PR…',creating_pr:'Creating draft PR…',published:'Published',needs_attention:'Check publication outcome',failed:'Preview unavailable',expired:'Preview expired'}[job.state]??job.state)));
 if(job.error)box.append(node('p',job.error,job.state==='published'?'muted':'error'));if(job.state==='needs_attention')box.append(node('p','A branch or PR may already exist. Prepare a fresh preview; matching work is reused, and conflicting branches are never overwritten.','muted'));
 const plan=job.plan;if(plan){box.append(node('p','Repository: '+plan.destination,'path'),node('p',plan.branch+' → '+plan.base,'path'),node('p','Commit: '+plan.head,'path'),node('p','Reviewed base: '+plan.baseSha,'path'),node('strong',plan.title),node('pre',plan.body||'(No description)','diff'),node('pre',plan.stat,'diff'));for(const commit of plan.commits){const details=node('details'),summary=node('summary',commit.subject+' · '+commit.sha.slice(0,12));details.append(summary,node('pre',commit.patch,'diff'));box.append(details);}box.append(node('p','All '+plan.commits.length+' outgoing commits are included above. Review their history, not only the final diff. Publishing can trigger GitHub Actions and notify repository subscribers.','muted'));}
 if(job.url){const link=node('a','Open pull request');link.href=job.url;link.target='_blank';link.rel='noopener noreferrer';box.append(link);}
 if(job.state==='ready'&&plan){box.append(node('p','This preview expires 15 minutes after preparation. Changing the form requires a new preview.','muted'),button('Approve this preview: push and create draft PR',async()=>{if(!confirm('Publish commit '+plan.head.slice(0,12)+' to '+plan.destination+' and create the draft PR shown in this preview? GitHub Actions and notifications may run.'))return;try{await api('/api/publishing',{action:'approve',id:job.id,fingerprint:plan.fingerprint});publishingSignature='';await updatePublishing();}catch(e){box.append(node('p',e.message,'error'));}},'primary'));}
 }catch(e){notice(e.message);}finally{publishingPolling=false;}}
setInterval(()=>{if(!document.hidden)void updatePublishing();},1500);
