import test from "node:test";
import assert from "node:assert/strict";
import { ntfyUrl, publishNtfy, taskNotificationCopy } from "../src/notifications.ts";

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

test("publishNtfy posts plain text with headers", async () => {
  const calls = [];
  await publishNtfy(
    { server: "https://ntfy.sh", topic: "agentd-alerts" },
    { title: "Hello", message: "World", click: "https://example.com", tags: ["bell"] },
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
  assert.equal(calls[0].init.headers.Click, "https://example.com");
  assert.equal(calls[0].init.headers.Tags, "bell");
});
