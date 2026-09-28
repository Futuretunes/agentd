// CI must exercise Linux boundaries, not report success after skipping them.
import {spawnSync} from 'node:child_process';
import {readdirSync} from 'node:fs';
if(process.platform!=='linux'){console.error('Isolation CI requires Linux');process.exit(1);}
const result=spawnSync(process.execPath,['--test','--test-reporter=tap',...readdirSync('test').filter(f=>f.endsWith('.test.mjs')).map(f=>'test/'+f)],{encoding:'utf8',env:{...process.env,AGENTD_TEST_ISOLATION:'1'},maxBuffer:16*1024*1024});
process.stdout.write(result.stdout??'');process.stderr.write(result.stderr??'');
if(result.error||result.status!==0||/^.*# SKIP\b/im.test(result.stdout??'')||!/^# skipped 0$/m.test(result.stdout??'')){console.error('Isolation suite failed, skipped a test, or did not report completion.');process.exit(1);}
