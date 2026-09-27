import {execFileSync} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';

const env = () => ({...process.env,GIT_CONFIG_GLOBAL:'/dev/null',GIT_CONFIG_NOSYSTEM:'1',GIT_TERMINAL_PROMPT:'0'});
export function git(repo:string,args:string[],extra:NodeJS.ProcessEnv={}) {
  return execFileSync('git',['-c','core.hooksPath=/dev/null','-C',repo,...args],{encoding:'utf8',env:{...env(),...extra},timeout:15000,maxBuffer:4*1024*1024,stdio:['ignore','pipe','pipe']}).trim();
}
export function snapshot(worktree:string,revision:string,stateDir:string) {
  if(git(worktree,['rev-parse','HEAD'])!==revision)throw Error('Worktree HEAD changed outside the review workflow');
  const temp=mkdtempSync(join(stateDir,'review-'));
  try {
    const index={GIT_INDEX_FILE:join(temp,'index')};
    git(worktree,['read-tree',revision],index);
    git(worktree,['add','-A','--','.',':(exclude).agentd-input',':(exclude).agentd-input/**'],index);
    const tree=git(worktree,['write-tree'],index);
    const names=git(worktree,['diff','--name-only','-z',revision,tree]).split('\0').filter(Boolean);
    const blocked=names.filter(name=>/(^|\/)(\.env($|\.)|\.credentials\.json$|auth\.json$|id_(rsa|ed25519)$)|\.(pem|key)$/i.test(name));
    const patch=git(worktree,['diff','--no-ext-diff','--no-textconv','--no-color','--no-renames',revision,tree]);
    if(patch.includes('Binary files '))blocked.push('[binary changes require local review]');
    const summary=git(worktree,['diff','--stat','--no-renames',revision,tree]);
    const truncated=Buffer.byteLength(patch)>180000;
    return {tree,files:names,summary,patch:patch.slice(0,180000),truncated,blocked};
  } finally {rmSync(temp,{recursive:true,force:true});}
}
export function commitSnapshot(repo:string,revision:string,tree:string,branch:string,message:string) {
  const existing=git(repo,['for-each-ref','--format=%(objectname)','refs/heads/'+branch]);
  if(existing){if(git(repo,['rev-parse',existing+'^{tree}'])!==tree||git(repo,['rev-parse',existing+'^'])!==revision)throw Error('Review branch already exists with different changes');return existing;}
  const sha=git(repo,['-c','user.name=agentd','-c','user.email=agentd@localhost','commit-tree',tree,'-p',revision,'-m',message]);
  git(repo,['update-ref','refs/heads/'+branch,sha,'0'.repeat(40)]);
  return sha;
}
