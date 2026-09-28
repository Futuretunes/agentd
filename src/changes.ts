import {sensitiveFilename,sensitiveContent,binaryNumstat,scanLimits,contentScan,acceptBlob,blobID} from './sensitive-data.ts';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';

export {localGit as git} from "./git-policy.ts";
import {localGit as git,gitOutput,GitOutputLimitError} from "./git-policy.ts";
export function snapshot(worktree:string,revision:string,stateDir:string) {
  if(git(worktree,['rev-parse','HEAD'])!==revision)throw Error('Worktree HEAD changed outside the review workflow');
  const temp=mkdtempSync(join(stateDir,'review-'));
  try {
    const index={GIT_INDEX_FILE:join(temp,'index')};
    git(worktree,['read-tree',revision],index);
    git(worktree,['add','-A','--','.',':(exclude).agentd-input',':(exclude).agentd-input/**'],index);
    const tree=git(worktree,['write-tree'],index);
    return treeSnapshot(worktree,revision,tree);
  } finally {rmSync(temp,{recursive:true,force:true});}
}
export function commitSnapshot(repo:string,revision:string,tree:string,branch:string,message:string,mergeParent?:string) {
  if(sensitiveContent(message).length)throw Error("Commit message may contain credential content. Remove it before committing.");
  const existing=git(repo,['for-each-ref','--format=%(objectname)','refs/heads/'+branch]);
  if(existing){if(git(repo,['rev-parse',existing+'^{tree}'])!==tree||git(repo,['show','-s','--format=%P',existing])!==[revision,...(mergeParent?[mergeParent]:[])].join(' '))throw Error('Review branch already exists with different changes');return existing;}
  const sha=git(repo,['-c','user.name=agentd','-c','user.email=agentd@localhost','commit-tree',tree,'-p',revision,...(mergeParent?['-p',mergeParent]:[]),'-m',message]);
  git(repo,['update-ref','refs/heads/'+branch,sha,'0'.repeat(40)]);
  return sha;
}

export function restoreSnapshot(worktree:string,tree:string){
  if(!/^[a-f0-9]{40}$/.test(tree))throw Error('Invalid revision snapshot');
  git(worktree,['read-tree','--reset','-u',tree]);
}

export function treeSnapshot(worktree:string,revision:string,tree:string){
  try {return readTreeSnapshot(worktree,revision,tree);}catch(error){
    if(!(error instanceof GitOutputLimitError))throw error;
    return {tree,files:[] as string[],summary:"Change listing exceeds the safe review limit.",patch:"",truncated:true,blocked:[] as string[]};
  }
}
function readTreeSnapshot(worktree:string,revision:string,tree:string){
    const names=git(worktree,['diff','--name-only','-z',revision,tree]).split('\0').filter(Boolean);
    const blocked=names.filter(sensitiveFilename);
    const scan=contentScan();
    if(names.length>scanLimits.files)blocked.push('[too many files for sensitive-data review]');
    else if(!blocked.length) {
      try {for(const name of names)for(const rev of [revision,tree]) {
        const sha=blobID(git(worktree,['--literal-pathspecs','ls-tree','-z',rev,'--',name]));
        if(!sha||!acceptBlob(scan,sha,git(worktree,['cat-file','-s',sha])))continue;
        const body=git(worktree,['cat-file','blob',sha]);
        if(body.includes('\0'))blocked.push('[binary changes require local review]');
        if(sensitiveContent(body).length)blocked.push(name+' [possible credential content]');
      }} catch {blocked.push('[sensitive-data scan incomplete; separate review required]');}
    }
    if(binaryNumstat(git(worktree,['diff','--numstat','-z','--no-renames',revision,tree])))blocked.push('[binary changes require local review]');
    // Do not return suspected secrets to a browser in a patch, even before approval.
    let patch='[Diff withheld: sensitive, binary or unscannable changes require separate review.]',truncated=false;
    if(!blocked.length){
      try {patch=gitOutput(worktree,['diff','--no-ext-diff','--no-textconv','--no-color','--no-renames',revision,tree],{maxBuffer:180000});}
      catch(error){if(!(error instanceof GitOutputLimitError))throw error;patch='';truncated=true;}
    }
    const summary=git(worktree,['diff','--stat','--stat-count=100','--no-renames',revision,tree]);
    return {tree,files:names,summary,patch,truncated,blocked};
}

// Materialize only the approved Git tree, never the agent's mutable working directory.
// A detached worktree supplies the Git metadata expected by the isolation boundary.
export function checkSnapshot(repo:string,revision:string,tree:string,stateDir:string) {
  if(!/^[a-f0-9]{40}$/.test(tree))throw Error('Invalid check snapshot');
  const root=mkdtempSync(join(stateDir,'check-tree-')),worktree=join(root,'worktree');
  let registered=false;
  const cleanup=()=>{try{if(registered){git(repo,['worktree','remove','--force',worktree]);registered=false;}}finally{rmSync(root,{recursive:true,force:true});}};
  try {
    git(repo,['worktree','add','--detach','--no-checkout',worktree,revision]);registered=true;
    restoreSnapshot(worktree,tree);
    return {worktree,cleanup};
  } catch(error) {cleanup();throw error;}
}
