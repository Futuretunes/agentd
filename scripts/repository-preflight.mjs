import {mkdtempSync,mkdirSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';import {githubAccount} from '../src/github-account.ts';import {repositoryGit,inspectRepository} from '../src/repositories.ts';
const root=mkdtempSync(join(tmpdir(),'agentd-repository-preflight-')),owner='a'.repeat(64);let account;
try{
 const git=repositoryGit({stateDir:root}),signal=new AbortController().signal,url='https://github.com/Futuretunes/agentd.git';
 const refs=await inspectRepository(git,root,url,signal);if(!refs.branches.includes('main'))throw Error('Public branch discovery failed');const clone=join(root,'clone');mkdirSync(clone);await git(clone,['clone','--depth','1','--single-branch','--no-tags','--no-recurse-submodules','--branch','main','--',url,'.'],signal,true,clone);if(!/^[a-f0-9]{40}$/.test(await git(clone,['rev-parse','HEAD'],signal)))throw Error('Invalid clone');console.log('github: public repository discovery and clone verified; no repository scripts ran');
 account=githubAccount(join(root,'github'),process.argv[2]??'/usr/local/bin/gh');account.start(owner);let recognized=false;
 for(let n=0;n<150;n++){const view=account.view(owner);if(view.session?.code){recognized=true;account.cancel(owner,view.session.id);break;}if(!view.busy)break;await new Promise(r=>setTimeout(r,100));}
 await account.close();if(!recognized)throw Error('Native GitHub device prompt not recognized');console.log('github: native device sign-in recognized and cancelled in an empty profile; no account connected');
}finally{await account?.close();rmSync(root,{recursive:true,force:true});}
