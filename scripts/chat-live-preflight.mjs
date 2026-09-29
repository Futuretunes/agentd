// One short subscription request, run explicitly by the installer as the service account.
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";
import { invocation } from "../src/adapters.ts";
import { isolated } from "../src/isolation.ts";
const root = mkdtempSync("/srv/agentd/tmp/chat-live-"),
  tree = join(root, "empty"),
  state = join(root, "state");
mkdirSync(tree);
mkdirSync(state);
let sandbox;
try {
  const [command, args] = invocation("codex", {
    mode: "chat",
    images: [],
    prompt: "What is two plus two? Reply with exactly CHAT_LIVE_OK:4 and nothing else.",
  });
  sandbox = isolated(tree, state, command, args, "codex", undefined, false, true);
  const result = spawnSync(sandbox.command, sandbox.args, {
    cwd: tree,
    env: { HOME: homedir(), PATH: process.env.PATH, LANG: "C.UTF-8", TERM: "dumb" },
    encoding: "utf8",
    timeout: 120000,
    stdio: ["ignore", "pipe", "pipe"],
  });
  assert.equal(
    result.status,
    0,
    "Chat subscription check did not complete. Reconnect Codex in Operations on the existing release, then retry.",
  );
  assert.equal(
    result.stdout.trim(),
    "CHAT_LIVE_OK:4",
    "Chat subscription check returned an unexpected answer",
  );
  console.log(
    "codex: native subscription answered inside empty, read-only, provider-restricted chat sandbox",
  );
} finally {
  sandbox?.cleanup();
  rmSync(root, { recursive: true, force: true });
}
