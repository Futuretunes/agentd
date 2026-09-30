import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  accessKeyRecoveryStatus,
  deleteAccessKeyRecovery,
} from "../src/admin-helper.ts";
import { accessKeyHash } from "../src/access-key.ts";

test("access-key recovery status and delete", () => {
  const root = mkdtempSync(join(tmpdir(), "agentd-recovery-"));
  const mobile = join(root, "mobile.json");
  const recovery = join(root, "mobile-access.txt");
  const key = "abcdefghijklmnopqrstuvwx";
  writeFileSync(mobile, JSON.stringify({ accessHash: accessKeyHash(key) }) + "\n", {
    mode: 0o600,
  });
  writeFileSync(recovery, key + "\n", { mode: 0o600 });
  chmodSync(mobile, 0o600);
  chmodSync(recovery, 0o600);
  const uid = process.getuid?.() ?? 0;
  assert.equal(accessKeyRecoveryStatus(recovery, uid).present, true);
  assert.deepEqual(deleteAccessKeyRecovery(key, mobile, recovery, uid), {
    deleted: true,
    format: 1,
  });
  assert.equal(accessKeyRecoveryStatus(recovery, uid).present, false);
  assert.throws(() => deleteAccessKeyRecovery(key, mobile, recovery, uid), /not present/);
  writeFileSync(recovery, key + "\n", { mode: 0o644 });
  assert.equal(accessKeyRecoveryStatus(recovery, uid).present, false);
});
