import test from "node:test";
import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { applyNotificationSettings, notificationSettings } from "../src/admin-helper.ts";

test("notification settings set and clear", () => {
  const root = mkdtempSync(join(tmpdir(), "agentd-ntfy-"));
  const mobile = join(root, "mobile.json");
  writeFileSync(
    mobile,
    JSON.stringify({ accessHash: "a".repeat(64), origin: "https://x" }) + "\n",
    {
      mode: 0o640,
    },
  );
  chmodSync(mobile, 0o640);
  const uid = process.getuid?.() ?? 0;
  assert.equal(notificationSettings(mobile, uid).configured, false);
  assert.equal(notificationSettings(mobile, uid).paused, false);
  assert.equal(notificationSettings(mobile, uid).deliveryEnabled, false);
  const saved = applyNotificationSettings(
    { server: "https://ntfy.sh", topic: "agentd-alerts" },
    mobile,
    uid,
  );
  assert.equal(saved.configured, true);
  assert.equal(saved.paused, false);
  assert.equal(saved.server, "https://ntfy.sh");
  assert.equal(saved.topic, "agentd-alerts");
  assert.equal(saved.deliveryEnabled, true);
  const stored = JSON.parse(readFileSync(mobile, "utf8"));
  assert.deepEqual(stored.notifications, {
    ntfy: { server: "https://ntfy.sh", topic: "agentd-alerts" },
  });
  assert.throws(
    () =>
      applyNotificationSettings({ server: "http://ntfy.sh", topic: "x" }, mobile, uid),
    /https/,
  );
  const cleared = applyNotificationSettings({ clear: true }, mobile, uid);
  assert.equal(cleared.configured, false);
  assert.equal(cleared.paused, false);
  assert.equal(cleared.deliveryEnabled, false);
  assert.equal("notifications" in JSON.parse(readFileSync(mobile, "utf8")), false);
});

test("notification settings pause and resume keep destination", () => {
  const root = mkdtempSync(join(tmpdir(), "agentd-ntfy-pause-"));
  const mobile = join(root, "mobile.json");
  writeFileSync(
    mobile,
    JSON.stringify({ accessHash: "a".repeat(64), origin: "https://x" }) + "\n",
    { mode: 0o640 },
  );
  chmodSync(mobile, 0o640);
  const uid = process.getuid?.() ?? 0;
  assert.throws(
    () => applyNotificationSettings({ paused: true }, mobile, uid),
    /Configure an ntfy destination/,
  );
  applyNotificationSettings(
    { server: "https://ntfy.sh", topic: "agentd-alerts" },
    mobile,
    uid,
  );
  const paused = applyNotificationSettings({ paused: true }, mobile, uid);
  assert.equal(paused.configured, true);
  assert.equal(paused.paused, true);
  assert.equal(paused.deliveryEnabled, false);
  assert.equal(paused.server, "https://ntfy.sh");
  assert.equal(paused.topic, "agentd-alerts");
  assert.deepEqual(JSON.parse(readFileSync(mobile, "utf8")).notifications, {
    ntfy: { server: "https://ntfy.sh", topic: "agentd-alerts", paused: true },
  });
  const resumed = applyNotificationSettings({ paused: false }, mobile, uid);
  assert.equal(resumed.configured, true);
  assert.equal(resumed.paused, false);
  assert.equal(resumed.deliveryEnabled, true);
  assert.deepEqual(JSON.parse(readFileSync(mobile, "utf8")).notifications, {
    ntfy: { server: "https://ntfy.sh", topic: "agentd-alerts" },
  });
  applyNotificationSettings({ paused: true }, mobile, uid);
  const cleared = applyNotificationSettings({ clear: true }, mobile, uid);
  assert.equal(cleared.configured, false);
  assert.equal(cleared.paused, false);
  assert.equal("notifications" in JSON.parse(readFileSync(mobile, "utf8")), false);
});
