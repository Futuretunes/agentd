import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { runner } from "../src/runner.ts";
import { prepareWorktree } from "../src/worktree-preparation.ts";
import { resourceLimits } from "../src/resources.ts";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "prep-")),
    repo = join(root, "repo"),
    trees = join(root, "trees");
  mkdirSync(repo);
  mkdirSync(trees);
  const git = (...args) =>
    execFileSync("git", ["-C", repo, ...args], {
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  git("init", "-b", "main");
  writeFileSync(join(repo, "README.md"), "fixture");
  git("add", ".");
  git(
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "fixture",
  );
  return { root, repo, trees, revision: git("rev-parse", "HEAD"), git };
}
async function waitFor(predicate) {
  for (let i = 0; i < 400; i++) {
    if (predicate()) return;
    await sleep(10);
  }
  throw Error("Test condition timed out");
}
test("checkout helper yields to the event loop and preserves Git policy and checkout budgets", async () => {
  const f = fixture();
  try {
    const input = {
      repo: f.repo,
      tree: join(f.trees, "first"),
      revision: f.revision,
      seed: null,
      limits: resourceLimits,
    };
    let tick = false;
    setImmediate(() => {
      tick = true;
    });
    await prepareWorktree(input, new AbortController().signal);
    assert.equal(tick, true);
    assert.equal(readFileSync(join(input.tree, "README.md"), "utf8"), "fixture");
    await assert.rejects(
      prepareWorktree(
        {
          ...input,
          tree: join(f.trees, "too-big"),
          limits: { ...resourceLimits, worktreeBytes: 1 },
        },
        new AbortController().signal,
      ),
    );
    assert.equal(existsSync(join(f.trees, "too-big")), false);
    f.git("config", "filter.evil.smudge", "touch SHOULD_NOT_RUN");
    await assert.rejects(
      prepareWorktree(
        { ...input, tree: join(f.trees, "unsafe") },
        new AbortController().signal,
      ),
    );
    assert.equal(existsSync(join(f.trees, "unsafe")), false);
    const abort = new AbortController();
    abort.abort();
    await assert.rejects(prepareWorktree(input, abort.signal), /stopped/);
  } finally {
    rmSync(f.root, { recursive: true, force: true });
  }
});
test("slow preparation holds the worker slot while status and cancellation remain responsive; partial edits survive", async () => {
  const f = fixture();
  let prepared = false,
    calls = 0;
  const config = {
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: f.trees,
    logs: join(f.root, "logs"),
    editing: true,
    editAdapters: ["claude"],
    command: () => {
      calls++;
      return [process.execPath, ["-e", ""]];
    },
    accountStatus: async () => ({ state: "signed_out" }),
    prepareWorktree: async (input, signal) => {
      await prepareWorktree(input, signal);
      prepared = true;
      await new Promise((resolve, reject) => {
        if (signal.aborted) return reject(Error("stopped"));
        signal.addEventListener("abort", () => reject(Error("stopped")), { once: true });
      });
    },
  };
  const app = runner(config);
  await once(app.server, "listening");
  try {
    const task = app.request({
      op: "create",
      adapter: "claude",
      mode: "edit",
      prompt: "fixture",
    });
    const approval = app.request({ op: "show", id: task.id });
    app.request({ op: "approve", id: task.id, fingerprint: approval.task.approval });
    await waitFor(() => prepared);
    assert.equal(app.request({ op: "show", id: task.id }).task.status, "running");
    assert.throws(
      () =>
        app.request({
          op: "account-start",
          action: "logout",
          adapter: "claude",
          owner: "a".repeat(64),
        }),
      /current work/,
    );
    app.request({ op: "cancel", id: task.id });
    await waitFor(
      () => app.request({ op: "show", id: task.id }).task.status === "cancelled",
    );
    const result = app.request({ op: "show", id: task.id }).task;
    assert.equal(calls, 0);
    assert.equal(result.review, "pending");
    assert.equal(readFileSync(join(result.worktree, "README.md"), "utf8"), "fixture");
  } finally {
    await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});
test("shutdown waits for preparation cancellation without starting a model", async () => {
  const f = fixture();
  let entered = false,
    stopped = false,
    calls = 0;
  const app = runner({
    repo: f.repo,
    stateDir: join(f.root, "state"),
    worktrees: f.trees,
    logs: join(f.root, "logs"),
    command: () => {
      calls++;
      return [process.execPath, ["-e", ""]];
    },
    accountStatus: async () => ({ state: "signed_out" }),
    prepareWorktree: async (_input, signal) => {
      entered = true;
      await new Promise((resolve, reject) =>
        signal.addEventListener(
          "abort",
          () => {
            stopped = true;
            reject(Error("stopped"));
          },
          { once: true },
        ),
      );
    },
  });
  await once(app.server, "listening");
  try {
    const task = app.request({ op: "create", adapter: "claude", prompt: "fixture" });
    app.request({ op: "approve", id: task.id });
    await waitFor(() => entered);
    await app.close();
    assert.equal(stopped, true);
    assert.equal(calls, 0);
  } finally {
    if (!stopped) await app.close();
    rmSync(f.root, { recursive: true, force: true });
  }
});
