import {test} from 'node:test';
import assert from 'node:assert/strict';
import {namespacePolicy,sandboxCommand} from '../src/sandbox-policy.ts';
test('sandbox policy requires explicit namespaces, zero capabilities and filtered launch without fallback',()=>{
 for(const option of ['--unshare-user','--disable-userns','--assert-userns-disabled','--unshare-uts','--cap-drop'])assert.ok(namespacePolicy.includes(option));
 assert.ok(namespacePolicy.includes('ALL'));assert.ok(!namespacePolicy.includes('--unshare-user-try'));
 const command=sandboxCommand(['--','/usr/bin/true']);assert.equal(command.command,'/usr/bin/python3');assert.equal(command.args[0],'-I');assert.match(command.args[1],/sandbox-launch.py$/);assert.deepEqual(command.args.slice(2),['/usr/bin/bwrap','--','/usr/bin/true']);
});
