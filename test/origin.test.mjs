import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { applyOriginSettings, originSettings } from "../src/admin-helper.ts";

test("origin settings set and reject unsafe values", () => {
  const root = mkdtempSync(join(tmpdir(), "agentd-origin-"));
  const mobile = join(root, "mobile.json");
  writeFileSync(
    mobile,
    JSON.stringify({ accessHash: "a".repeat(64), origin: "https://old.example" }) + "\n",
    { mode: 0o640 },
  );
  chmodSync(mobile, 0o640);
  const uid = process.getuid?.() ?? 0;
  assert.equal(originSettings(mobile, uid).origin, "https://old.example");
  assert.equal(originSettings(mobile, uid).valid, true);

  const saved = applyOriginSettings(
    { origin: "https://agentd.example:8443/" },
    mobile,
    uid,
  );
  assert.equal(saved.origin, "https://agentd.example:8443");
  assert.equal(saved.valid, true);
  assert.equal(
    JSON.parse(readFileSync(mobile, "utf8")).origin,
    "https://agentd.example:8443",
  );
  assert.equal(JSON.parse(readFileSync(mobile, "utf8")).accessHash, "a".repeat(64));

  assert.throws(
    () => applyOriginSettings({ origin: "http://agentd.example" }, mobile, uid),
    /https/,
  );
  assert.throws(
    () =>
      applyOriginSettings({ origin: "https://user:pass@agentd.example" }, mobile, uid),
    /credentials|path/,
  );
  assert.throws(
    () => applyOriginSettings({ origin: "https://agentd.example/path" }, mobile, uid),
    /path/,
  );
  assert.throws(
    () => applyOriginSettings({ origin: "https://agentd.example?x=1" }, mobile, uid),
    /path|credentials/,
  );
});
