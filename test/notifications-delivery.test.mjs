import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import {
  ntfyUrl,
  publishNtfy,
  taskNotificationCopy,
  taskNotificationClick,
  loadNotifiedKeys,
  saveNotifiedKeys,
  rememberNotifiedKey,
  notifiedKeysPath,
} from "../src/notifications.ts";

test("ntfy url and copy helpers", () => {
  assert.equal(
    ntfyUrl({ server: "https://ntfy.sh", topic: "agentd-alerts" }),
    "https://ntfy.sh/agentd-alerts",
  );
  assert.throws(() => ntfyUrl({ server: "http://ntfy.sh", topic: "x" }));
  assert.equal(taskNotificationCopy("queued", {}), null);
  assert.match(
    taskNotificationCopy("waiting_for_approval", {
      projectName: "Demo",
      adapter: "claude",
    })?.message ?? "",
    /Demo/,
  );
});

test("taskNotificationClick builds authenticated deep links without secrets", () => {
  assert.equal(taskNotificationClick(null, { project: "p1" }), undefined);
  assert.equal(taskNotificationClick("http://example.com", { project: "p1" }), undefined);
  assert.equal(
    taskNotificationClick("https://agentd.example", { project: null }),
    "https://agentd.example",
  );
  assert.equal(
    taskNotificationClick("https://agentd.example/", {
      project: "proj/1",
      conversation: "conv 2",
      task: "task&3",
    }),
    "https://agentd.example/?project=proj%2F1&conversation=conv%202&task=task%263",
  );
  assert.equal(
    taskNotificationClick("https://agentd.example", {
      project: "p1",
      conversation: null,
      task: "t1",
    }),
    "https://agentd.example/?project=p1&task=t1",
  );
  const click = taskNotificationClick("https://agentd.example", {
    project: "p1",
    conversation: "c1",
    task: "t1",
  });
  assert.ok(click);
  assert.doesNotMatch(click, /access|token|session|key=/i);
});

test("publishNtfy posts plain text with headers", async () => {
  const calls = [];
  await publishNtfy(
    { server: "https://ntfy.sh", topic: "agentd-alerts" },
    {
      title: "Hello",
      message: "World",
      click: "https://example.com/?project=p1",
      tags: ["bell"],
    },
    async (url, init) => {
      calls.push({ url, init });
      return new Response("", { status: 200 });
    },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://ntfy.sh/agentd-alerts");
  assert.equal(calls[0].init.method, "POST");
  assert.equal(calls[0].init.body, "World");
  assert.equal(calls[0].init.headers.Title, "Hello");
  assert.equal(calls[0].init.headers.Click, "https://example.com/?project=p1");
  assert.equal(calls[0].init.headers.Tags, "bell");
});

test("notified keys persist, trim, and fail open on corrupt files", () => {
  const root = mkdtempSync(join(tmpdir(), "agentd-notify-"));
  const path = notifiedKeysPath(root);
  assert.deepEqual([...loadNotifiedKeys(path)], []);
  writeFileSync(path, "{not-json");
  assert.deepEqual([...loadNotifiedKeys(path)], []);
  writeFileSync(path, JSON.stringify({ no: "array" }));
  assert.deepEqual([...loadNotifiedKeys(path)], []);

  const keys = new Set(["a:succeeded", "b:failed"]);
  saveNotifiedKeys(path, keys);
  assert.deepEqual(new Set(loadNotifiedKeys(path)), keys);
  assert.equal(JSON.parse(readFileSync(path, "utf8")).length, 2);

  const many = new Set();
  for (let i = 0; i < 501; i++) many.add(`id${i}:succeeded`);
  rememberNotifiedKey(many, "extra:failed");
  assert.equal(many.size, 400);
  assert.ok(many.has("extra:failed"));
  assert.ok(!many.has("id0:succeeded"));
});
