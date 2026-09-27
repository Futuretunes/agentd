import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('service permits namespace-local bubblewrap setup without granting host capabilities',()=>{
  const unit=readFileSync(new URL('../deploy/agentd.service',import.meta.url),'utf8');
  assert.match(unit,/^User=agentd$/m);
  assert.match(unit,/^NoNewPrivileges=true$/m);
  assert.match(unit,/^CapabilityBoundingSet=CAP_SYS_ADMIN$/m);
  assert.doesNotMatch(unit,/^AmbientCapabilities=/m);
  assert.match(unit,/^RestrictAddressFamilies=.*AF_NETLINK/m);
});
