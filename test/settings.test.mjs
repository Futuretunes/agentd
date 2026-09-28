import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { settings, resolveSettings } from "../src/execution-settings.ts";
import { normalizeModels, parseCursorModels } from "../src/model-catalog.ts";
import { selectionArguments, invocation } from "../src/adapters.ts";
import { runner } from "../src/runner.ts";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const models = [
    { id: "haiku", name: "Haiku", efforts: [], tier: "light" },
    {
      id: "sonnet",
      name: "Sonnet",
      efforts: ["low", "medium", "high"],
      tier: "balanced",
    },
    { id: "opus", name: "Opus", efforts: ["low", "medium", "high"], tier: "deep" },
  ],
  catalog = {
    models,
    source: "fixture native catalog",
    checkedAt: "2026-01-01T00:00:00Z",
  };
async function fixture(extra = {}) {
  const root = mkdtempSync(join(tmpdir(), "settings-")),
    repo = join(root, "repo"),
    stateDir = join(root, "state");
  mkdirSync(repo);
  mkdirSync(join(stateDir, "model-catalog"), { recursive: true });
  writeFileSync(join(stateDir, "model-catalog/claude.json"), JSON.stringify(catalog));
  execFileSync("git", ["-C", repo, "init", "-b", "main"], { stdio: "pipe" });
  writeFileSync(join(repo, "README.md"), "base");
  execFileSync("git", ["-C", repo, "add", "."]);
  execFileSync(
    "git",
    [
      "-C",
      repo,
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@localhost",
      "commit",
      "-m",
      "base",
    ],
    { stdio: "pipe" },
  );
  const config = {
    repo,
    stateDir,
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    enabledAdapters: ["claude", "codex", "cursor"],
    editing: true,
    editAdapters: ["claude", "cursor"],
    timeoutMs: 5000,
    accountStatus: async () => ({
      state: "signed_out",
      method: null,
      message: "Sign in",
      checkedAt: null,
    }),
    modelDiscovery: async () => models,
    command: (_id, prompt) => [
      process.execPath,
      [
        "-e",
        prompt.startsWith("hang")
          ? "require('fs').writeFileSync('partial.txt','keep me');setInterval(()=>{},1000)"
          : "console.log('done')",
      ],
    ],
    isolate: (_tree, _state, command, args) => ({ command, args, cleanup() {} }),
    ...extra,
  };
  let app = runner(config);
  await once(app.server, "listening");
  await sleep(10);
  return {
    root,
    config,
    get app() {
      return app;
    },
    async restart() {
      await app.close();
      app = runner(config);
      await once(app.server, "listening");
    },
    async close() {
      await app.close();
      rmSync(root, { recursive: true, force: true });
    },
  };
}
async function wait(f, id, state) {
  for (let i = 0; i < 200; i++) {
    const row = f.app.request({ op: "show", id }).task;
    if (row.status === state) return row;
    await sleep(10);
  }
  throw Error("Waiting for " + state);
}
const save = (f, values, scope = "project", conversation = null, agentScope = "claude") =>
  f.app.request({
    op: "settings-save",
    project: "default",
    agent: "claude",
    scope,
    conversation,
    agentScope,
    values,
  });
test("setting inheritance and routing are deterministic; manual pins, unsupported access and effort fail closed", () => {
  assert.throws(() => settings({ shell: true }));
  assert.throws(() => settings({ model: "--unsafe" }, "claude"));
  assert.throws(() => settings({ access: "edit" }, "claude", true));
  assert.throws(() => settings({ timeoutSeconds: 601 }));
  const resolve = (prompt, values) =>
    resolveSettings(
      [
        { source: "Project", values: { model: "auto", effort: "auto" } },
        { source: "Conversation · claude", values },
      ],
      "claude",
      "ask",
      prompt,
      catalog,
    );
  assert.equal(resolve("Summarize README.md", {}).selection.model, "haiku");
  assert.equal(resolve("Review authentication security", {}).selection.model, "opus");
  assert.equal(resolve("Implement a button", {}).selection.model, "sonnet");
  assert.equal(
    resolve("Review authentication security", { model: "haiku" }).selection.model,
    "haiku",
  );
  assert.equal(
    resolve("A task", { model: "sonnet", effort: "low" }).selection.effort,
    "low",
  );
  assert.throws(() => resolve("A task", { model: "haiku", effort: "high" }), /effort/);
  assert.throws(() => resolve("A task", { model: "removed" }), /catalog/);
  assert.throws(() => resolve("A task", { access: "chat" }), /blocked/);
  const restricted = resolveSettings(
    [
      { source: "Project", values: { access: "read" } },
      { source: "Project · claude", values: { access: "edit" } },
      { source: "Conversation", values: { access: "read" } },
      { source: "Conversation · claude", values: { access: "edit" } },
    ],
    "claude",
    "edit",
    "task",
    catalog,
  );
  assert.equal(restricted.sources.access, "Conversation · claude");
  assert.equal(restricted.permissions.shell, false);
  assert.equal(restricted.permissions.network, "Selected provider only");
});
test("native model metadata is sanitized and selection uses literal CLI arguments without weakening sandbox flags", () => {
  const m = normalizeModels("codex", [
    {
      model: "gpt-6-luna",
      displayName: "Luna",
      supportedReasoningEfforts: [
        { reasoningEffort: "low" },
        { reasoningEffort: "invented" },
      ],
    },
    { model: "--unsafe" },
    { model: "gpt-6-luna" },
  ]);
  assert.equal(m.length, 1);
  assert.deepEqual(m[0].efforts, ["low"]);
  assert.equal(m[0].tier, "light");
  assert.deepEqual(
    parseCursorModels(
      "Available models\n\nsonnet-4 - Sonnet (default)\nTip: use --model\n",
    )[0],
    { id: "sonnet-4", name: "Sonnet", efforts: [] },
  );
  assert.throws(() => parseCursorModels("private identity\nNot logged in"));
  assert.deepEqual(selectionArguments("claude", { model: "sonnet", effort: "low" }), [
    "--model",
    "sonnet",
    "--effort",
    "low",
  ]);
  assert.throws(() => selectionArguments("cursor", { model: "sonnet", effort: "high" }));
  assert.throws(() =>
    selectionArguments("claude", { model: "--force", effort: "provider" }),
  );
  const [, args] = invocation("claude", {
    prompt: "--unsafe",
    mode: "ask",
    images: [],
    selection: { model: "sonnet", effort: "medium" },
  });
  assert.ok(args.includes("dontAsk"));
  assert.equal(args.at(-1), "--unsafe");
  assert.equal(args[args.indexOf("--tools") + 1], "Read,Glob,Grep");
});
test("scope edits invalidate queued approvals; stale previews cannot approve; settings persist and reset to inheritance", async () => {
  const f = await fixture();
  try {
    save(f, { model: "auto", effort: "auto" });
    const task = f.app.request({
        op: "create",
        adapter: "claude",
        mode: "edit",
        prompt: "Implement a button",
      }),
      old = JSON.parse(task.execution);
    f.app.request({ op: "approve", id: task.id, fingerprint: old.fingerprint });
    save(f, { access: "read", model: "auto", effort: "auto" });
    let row = f.app.request({ op: "show", id: task.id }).task;
    assert.equal(row.status, "waiting_for_approval");
    assert.match(row.settings_error, /blocked/);
    await sleep(30);
    assert.equal(f.app.request({ op: "show", id: task.id }).task.worktree, null);
    save(f, { access: "edit", model: "sonnet", effort: "high" });
    row = f.app.request({ op: "show", id: task.id }).task;
    assert.notEqual(JSON.parse(row.execution).fingerprint, old.fingerprint);
    assert.throws(
      () => f.app.request({ op: "approve", id: row.id, fingerprint: old.fingerprint }),
      /stale/,
    );
    save(f, { model: "haiku", effort: "provider" }, "conversation", task.conversation);
    assert.equal(
      JSON.parse(f.app.request({ op: "show", id: task.id }).task.execution).selection
        .model,
      "haiku",
    );
    await f.restart();
    assert.equal(
      f.app.request({
        op: "settings-view",
        project: "default",
        conversation: task.conversation,
        agent: "claude",
        mode: "edit",
      }).effective.selection.model,
      "haiku",
    );
    save(f, {}, "conversation", task.conversation);
    row = f.app.request({ op: "show", id: task.id }).task;
    assert.equal(JSON.parse(row.execution).selection.model, "sonnet");
    f.app.request({
      op: "approve",
      id: row.id,
      fingerprint: JSON.parse(row.execution).fingerprint,
    });
    await wait(f, row.id, "succeeded");
    assert.ok(
      f.app.request({ op: "audit" }).some((e) => e.action === "invalidate-run-approval"),
    );
  } finally {
    await f.close();
  }
});
test("running attempts retain settings; restart preserves partial edits and requires a separate approval", async () => {
  const f = await fixture();
  try {
    const task = f.app.request({
      op: "create",
      adapter: "claude",
      mode: "edit",
      prompt: "hang",
      overrides: { model: "haiku" },
    });
    f.app.request({ op: "approve", id: task.id });
    const running = await wait(f, task.id, "running");
    await sleep(100);
    save(f, { model: "sonnet", effort: "high" }, "conversation", task.conversation);
    assert.equal(
      f.app.request({ op: "show", id: task.id }).task.execution,
      running.execution,
    );
    assert.throws(() => f.app.request({ op: "restart-settings", id: task.id }), /Stop/);
    f.app.request({ op: "cancel", id: task.id });
    await wait(f, task.id, "cancelled");
    const next = f.app.request({ op: "restart-settings", id: task.id });
    assert.equal(next.status, "waiting_for_approval");
    assert.equal(next.worktree, null);
    assert.equal(JSON.parse(next.execution).selection.model, "sonnet");
    assert.ok(next.seed_tree);
    assert.equal(f.app.request({ op: "restart-settings", id: task.id }).id, next.id);
    assert.equal(readFileSync(join(running.worktree, "partial.txt"), "utf8"), "keep me");
    assert.equal(f.app.request({ op: "show", id: task.id }).task.review, "superseded");
    f.app.request({ op: "approve", id: next.id });
    const nextRunning = await wait(f, next.id, "running");
    assert.equal(
      readFileSync(join(nextRunning.worktree, "partial.txt"), "utf8"),
      "keep me",
    );
    f.app.request({ op: "cancel", id: next.id });
    await wait(f, next.id, "cancelled");
  } finally {
    await f.close();
  }
});
test("changing settings during credential preparation cannot dispatch the previously approved policy", async () => {
  let release,
    started = false;
  const f = await fixture({
    strictWorkers: true,
    credentialRenewal: true,
    renewal: {
      ensure: () => {
        started = true;
        return new Promise((r) => (release = r));
      },
      view: () => ({ state: "ready" }),
      busy: () => false,
      close: async () => release?.(),
    },
  });
  try {
    const t = f.app.request({ op: "create", adapter: "claude", prompt: "read" });
    f.app.request({ op: "approve", id: t.id });
    for (let i = 0; i < 100 && !started; i++) await sleep(10);
    assert.equal(started, true);
    save(f, { access: "blocked" });
    release();
    await sleep(30);
    const row = f.app.request({ op: "show", id: t.id }).task;
    assert.equal(row.status, "waiting_for_approval");
    assert.equal(row.worktree, null);
  } finally {
    await f.close();
  }
});
test("model discovery changes invalidate pins instead of silently falling back and cannot race account changes", async () => {
  let release;
  const f = await fixture({ modelDiscovery: () => new Promise((r) => (release = r)) });
  try {
    const t = f.app.request({
      op: "create",
      adapter: "claude",
      prompt: "read",
      overrides: { model: "sonnet" },
    });
    f.app.request({ op: "models-refresh", agent: "claude" });
    assert.throws(() => f.app.request({ op: "approve", id: t.id }), /Finish/);
    assert.throws(
      () =>
        f.app.request({
          op: "account-start",
          adapter: "claude",
          action: "login",
          owner: "a".repeat(64),
        }),
      /model discovery/,
    );
    await sleep(0);
    release([models[0]]);
    for (
      let i = 0;
      i < 100 && f.app.request({ op: "settings-view", agent: "claude" }).catalog.busy;
      i++
    )
      await sleep(10);
    assert.match(f.app.request({ op: "show", id: t.id }).task.settings_error, /catalog/);
    assert.throws(() => f.app.request({ op: "approve", id: t.id }), /catalog/);
  } finally {
    await f.close();
  }
});

test("follow-up context can be disabled per run and changed answer content invalidates approval", async () => {
  const prompts = [];
  const f = await fixture({
    command: (_id, prompt) => {
      prompts.push(prompt);
      return [
        process.execPath,
        ["-e", "console.log('saved answer');console.error('PRIVATE TOOL STDERR')"],
      ];
    },
  });
  try {
    assert.throws(() => settings({ context: "logs" }), /previous/);
    const first = f.app.request({
      op: "create",
      adapter: "claude",
      prompt: "first instruction",
    });
    f.app.request({ op: "approve", id: first.id });
    const done = await wait(f, first.id, "succeeded");
    const next = f.app.request({
        op: "create",
        adapter: "claude",
        parent: first.id,
        prompt: "follow up",
      }),
      old = JSON.parse(next.execution);
    assert.equal(old.context.source, "saved_answer");
    writeFileSync(done.log + ".answer", "changed saved answer");
    assert.throws(
      () => f.app.request({ op: "approve", id: next.id, fingerprint: old.fingerprint }),
      /Settings changed/,
    );
    const fresh = JSON.parse(f.app.request({ op: "show", id: next.id }).task.execution);
    assert.notEqual(fresh.fingerprint, old.fingerprint);
    f.app.request({ op: "approve", id: next.id, fingerprint: fresh.fingerprint });
    await wait(f, next.id, "succeeded");
    assert.match(prompts[1], /changed saved answer/);
    assert.ok(!prompts[1].includes("PRIVATE TOOL STDERR"));
    const clean = f.app.request({
      op: "create",
      adapter: "claude",
      conversation: next.conversation,
      prompt: "start fresh context",
      overrides: { context: "none" },
    });
    assert.equal(JSON.parse(clean.execution).context.source, "disabled");
    f.app.request({ op: "approve", id: clean.id });
    await wait(f, clean.id, "succeeded");
    assert.equal(prompts[2], "start fresh context");
    save(f, { context: "none" });
    const later = f.app.request({
      op: "create",
      adapter: "claude",
      conversation: next.conversation,
      prompt: "continue",
    });
    assert.equal(JSON.parse(later.execution).settings.context, "none");
  } finally {
    await f.close();
  }
});
