import {spawnSync} from 'node:child_process';
// Fixed, administrator-enabled Node checks. No command string comes from HTTP.
for(const args of [['run','typecheck','--if-present'],['test']]){
  console.log('$ npm '+args.join(' '));
  const result=spawnSync('npm',args,{stdio:'inherit',env:{...process.env,npm_config_cache:process.env.AGENTD_CHECK_CACHE??'/tmp/npm-cache'},timeout:180000});
  if(result.error)console.error(result.error.message);
  if(result.error||result.status!==0)process.exit(result.status||1);
}
