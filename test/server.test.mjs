import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { start } from '../src/server.ts';
test('loopback health metrics method restrictions and persistent SQLite state', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'agentd-test-'));
  let app;
  try {
    for (let boot = 1; boot <= 2; boot++) {
      app = start({ stateDir: dir, port: 0 });
      await once(app.server, 'listening');
      const address = app.server.address();
      assert.equal(address.address, '127.0.0.1');
      const url = `http://127.0.0.1:${address.port}`;
      for (const path of ['/healthz', '/readyz', '/v1/status']) {
        const response = await fetch(url + path);
        assert.equal(response.status, 200);
        const status = await response.json();
        assert.equal(status.starts, boot);
        assert.equal(status.workerDispatch, false);
      }
      const metrics = await (await fetch(url + '/metrics')).text();
      assert.match(metrics, new RegExp(`agentd_startups_total ${boot}`));
      assert.equal((await fetch(url + '/v1/status', { method: 'POST' })).status, 405);
      assert.equal((await fetch(url + '/missing')).status, 404);
      await app.close(); app = undefined;
    }
  } finally {
    if (app) await app.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
