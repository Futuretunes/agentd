import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import { runner } from "../src/runner.ts";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function repo(root, name) {
  const path = join(root, name);
  mkdirSync(path);
  const git = (...args) => execFileSync("git", ["-C", path, ...args], { stdio: "pipe" });
  git("init", "-b", "main");
  writeFileSync(join(path, "README.md"), name);
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
  return path;
}
async function done(app, id) {
  for (let i = 0; i < 200; i++) {
    const t = app.request({ op: "show", id }).task;
    if (t.status === "succeeded") return t;
    if (t.status === "failed") throw Error(t.error);
    await sleep(10);
  }
  throw Error("Timeout");
}
test("projects route work to the correct repository and keep conversations separate", async () => {
  const root = mkdtempSync(join(tmpdir(), "projects-"));
  const config = {
    stateDir: join(root, "state"),
    repo: repo(root, "original"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    command: () => [
      process.execPath,
      ["-e", "console.log(require('fs').readFileSync('README.md','utf8'))"],
    ],
  };
  let app = runner(config);
  await once(app.server, "listening");
  try {
    const project = app.request({
      op: "project-register",
      name: "Second",
      repo: repo(root, "second"),
    });
    assert.throws(
      () => app.request({ op: "project-register", name: "bad", repo: root }),
      /Command failed/,
    );
    const a = app.request({
      op: "create",
      project: project.id,
      adapter: "codex",
      prompt: "Read",
    });
    const b = app.request({
      op: "create",
      project: "default",
      adapter: "claude",
      prompt: "Other",
    });
    assert.throws(
      () =>
        app.request({
          op: "create",
          project: "default",
          conversation: a.conversation,
          adapter: "codex",
          prompt: "wrong",
        }),
      /another project/,
    );
    assert.throws(
      () =>
        app.request({
          op: "create",
          project: project.id,
          conversation: a.conversation,
          adapter: "codex",
          prompt: "wait",
        }),
      /current turn/,
    );
    app.request({ op: "approve", id: a.id });
    const run = await done(app, a.id);
    assert.equal(readFileSync(run.log, "utf8").trim(), "second");
    const next = app.request({
      op: "create",
      conversation: a.conversation,
      project: project.id,
      adapter: "claude",
      prompt: "Continue",
    });
    assert.equal(next.parent, a.id);
    assert.equal(next.status, "waiting_for_approval");
    assert.throws(
      () => app.request({ op: "conversation-archive", id: a.conversation }),
      /pending/,
    );
    app.request({ op: "cancel", id: next.id });
    app.request({ op: "conversation-rename", id: a.conversation, name: "Architecture" });
    const thread = app.request({ op: "conversation-show", id: a.conversation });
    assert.equal(thread.messages.length, 2);
    assert.equal(thread.conversation.title, "Architecture");
    assert.equal(app.request({ op: "conversations", project: "default" }).length, 1);
    assert.equal(
      app.request({ op: "conversations", project: "default" })[0].id,
      b.conversation,
    );
    const blank = app.request({ op: "project-create", name: "Fresh project" });
    assert.equal(
      execFileSync("git", ["-C", blank.repo, "rev-list", "--count", "HEAD"], {
        encoding: "utf8",
      }).trim(),
      "1",
    );
    app.request({ op: "conversation-archive", id: a.conversation });
    assert.equal(app.request({ op: "conversations", project: project.id }).length, 0);
    await app.close();
    app = runner(config);
    await once(app.server, "listening");
    assert.equal(app.request({ op: "projects" }).length, 3);
    assert.equal(
      app.request({ op: "conversation-show", id: a.conversation }).messages.length,
      2,
    );
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("legacy tasks migrate to their original project and preserve follow-up ancestry", async () => {
  const root = mkdtempSync(join(tmpdir(), "migration-")),
    stateDir = join(root, "state");
  mkdirSync(stateDir);
  const db = new DatabaseSync(join(stateDir, "tasks.sqlite"));
  db.exec(
    `CREATE TABLE tasks(id TEXT PRIMARY KEY,adapter TEXT,prompt TEXT,revision TEXT,status TEXT,created TEXT,updated TEXT,worktree TEXT,log TEXT,error TEXT,attachments TEXT DEFAULT '[]',parent TEXT);`,
  );
  const insert = db.prepare(
    "INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,parent) VALUES(?,?,?,?,?,?,?,?)",
  );
  insert.run("old", "codex", "Original", "rev", "succeeded", "1", "1", null);
  insert.run("follow", "claude", "Follow up", "rev", "succeeded", "2", "2", "old");
  db.close();
  const app = runner({
    stateDir,
    repo: repo(root, "original"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
  });
  await once(app.server, "listening");
  try {
    const threads = app.request({ op: "conversations", project: "default" });
    assert.equal(threads.length, 1);
    const data = app.request({ op: "conversation-show", id: threads[0].id });
    assert.equal(data.messages.length, 2);
    assert.equal(data.messages[1].parent, "old");
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("operations summarizes global work and sanitized account health without prompts or logs", async () => {
  let accountChecks = 0;
  const root = mkdtempSync(join(tmpdir(), "operations-")),
    config = {
      stateDir: join(root, "state"),
      repo: repo(root, "original"),
      worktrees: join(root, "trees"),
      logs: join(root, "logs"),
      command: (_adapter, prompt) => [
        process.execPath,
        [
          "-e",
          prompt === "fail" ? "process.exit(1)" : "console.log('private model output')",
        ],
      ],
      accountStatus: async (id) => {
        accountChecks++;
        return {
          state: id === "claude" ? "signed_in" : "signed_out",
          method: id === "claude" ? "Claude subscription" : null,
          checkedAt: "2026-01-01T00:00:00.000Z",
          message: id === "claude" ? "Account is signed in" : "Sign-in required",
        };
      },
    };
  const app = runner(config);
  await once(app.server, "listening");
  try {
    const complete = app.request({
      op: "create",
      adapter: "claude",
      prompt: "private prompt",
    });
    app.request({ op: "approve", id: complete.id });
    await done(app, complete.id);
    const waiting = app.request({
      op: "create",
      adapter: "claude",
      prompt: "private waiting prompt",
    });
    const failed = app.request({ op: "create", adapter: "codex", prompt: "fail" });
    app.request({ op: "approve", id: failed.id });
    for (
      let i = 0;
      i < 100 && app.request({ op: "show", id: failed.id }).task.status !== "failed";
      i++
    )
      await sleep(10);
    await sleep(10);
    const value = app.request({ op: "operations" }),
      serialized = JSON.stringify(value);
    app.request({ op: "operations" });
    assert.equal(value.service.state, "healthy");
    assert.equal(value.counts.succeeded, 1);
    assert.equal(value.counts.waiting_for_approval, 1);
    assert.equal(value.counts.failed, 1);
    assert.equal(value.tasks.length, 3);
    assert.equal(
      value.tasks.find((x) => x.id === waiting.id).conversationTitle,
      "private waiting prompt",
    );
    assert.equal(
      value.adapters.find((x) => x.id === "claude").account.state,
      "signed_in",
    );
    assert.equal(value.adapters[0].usage.state, "unavailable");
    assert.equal(accountChecks, 3);
    assert.ok(!serialized.includes("private model output"));
    assert.ok(!value.tasks.some((x) => "prompt" in x || "log" in x || "worktree" in x));
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("archive and restore preserve files and history, prevent hidden pending work, and survive restart", async () => {
  const root = mkdtempSync(join(tmpdir(), "archive-")),
    config = {
      stateDir: join(root, "state"),
      repo: repo(root, "original"),
      worktrees: join(root, "trees"),
      logs: join(root, "logs"),
      command: () => [process.execPath, ["-e", 'console.log("done")']],
    };
  let app = runner(config);
  await once(app.server, "listening");
  try {
    const p = app.request({ op: "project-create", name: "Archive me" }),
      t = app.request({
        op: "create",
        project: p.id,
        adapter: "claude",
        prompt: "unfinished",
      });
    assert.throws(() => app.request({ op: "project-archive", id: p.id }), /pending/);
    app.request({ op: "cancel", id: t.id });
    app.request({ op: "conversation-archive", id: t.conversation });
    app.request({ op: "project-archive", id: p.id });
    assert.ok(!app.request({ op: "projects" }).some((x) => x.id === p.id));
    assert.equal(app.request({ op: "archived-projects" })[0].id, p.id);
    assert.throws(
      () => app.request({ op: "conversation-restore", id: t.conversation }),
      /Restore the project/,
    );
    assert.throws(
      () =>
        app.request({ op: "create", project: p.id, adapter: "claude", prompt: "bad" }),
      /archived/,
    );
    await app.close();
    app = runner(config);
    await once(app.server, "listening");
    assert.equal(
      app.request({ op: "history", filter: "archived" }).items[0].id,
      t.conversation,
    );
    app.request({ op: "project-restore", id: p.id });
    assert.equal(app.request({ op: "conversations", project: p.id }).length, 0);
    app.request({ op: "conversation-restore", id: t.conversation });
    assert.equal(
      app.request({ op: "conversations", project: p.id })[0].id,
      t.conversation,
    );
    assert.equal(
      app.request({ op: "conversation-show", id: t.conversation }).messages[0].id,
      t.id,
    );
    assert.equal(
      execFileSync("git", ["-C", p.repo, "rev-list", "--count", "HEAD"], {
        encoding: "utf8",
      }).trim(),
      "1",
    );
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("history search is literal and paginated; older turns retain chronology without gaps", async () => {
  const root = mkdtempSync(join(tmpdir(), "history-")),
    app = runner({
      stateDir: join(root, "state"),
      repo: repo(root, "original"),
      worktrees: join(root, "trees"),
      logs: join(root, "logs"),
      command: () => [process.execPath, []],
    });
  await once(app.server, "listening");
  try {
    let conversation;
    const ids = [];
    for (let n = 0; n < 65; n++) {
      const task = app.request({
        op: "create",
        adapter: "claude",
        prompt: n === 30 ? "needle %_ literal" : "Turn " + n,
        ...(conversation ? { conversation } : {}),
      });
      conversation = task.conversation;
      ids.push(task.id);
      app.request({ op: "cancel", id: task.id });
    }
    app.request({
      op: "conversation-rename",
      id: conversation,
      name: "Long conversation",
    });
    for (let n = 0; n < 55; n++) {
      const t = app.request({ op: "create", adapter: "claude", prompt: "Separate " + n });
      app.request({ op: "cancel", id: t.id });
    }
    const first = app.request({ op: "history" }),
      second = app.request({ op: "history", before: first.next });
    assert.equal(first.items.length, 50);
    assert.equal(second.items.length, 6);
    assert.equal(new Set([...first.items, ...second.items].map((x) => x.id)).size, 56);
    assert.equal(second.next, null);
    assert.equal(app.request({ op: "history", query: "%_" }).items.length, 1);
    assert.equal(
      app.request({ op: "history", query: "needle" }).items[0].id,
      conversation,
    );
    assert.equal(app.request({ op: "history", query: "' OR 1=1 --" }).items.length, 0);
    const pages = [];
    let before;
    do {
      const page = app.request({
        op: "conversation-show",
        id: conversation,
        ...(before ? { before } : {}),
      });
      pages.unshift(...page.messages.map((x) => x.id));
      before = page.olderBefore;
    } while (before);
    assert.deepEqual(pages, ids);
    assert.throws(() => app.request({ op: "history", before: -1 }), /Invalid/);
    assert.throws(
      () => app.request({ op: "conversation-show", id: conversation, before: 0 }),
      /Invalid/,
    );
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test("Operations usage is normalized, throttled and cleared after signed-out status", async () => {
  const root = mkdtempSync(join(tmpdir(), "usage-operations-"));
  let signedIn = true,
    calls = 0;
  const app = runner({
    stateDir: join(root, "state"),
    repo: repo(root, "repo"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    command: () => [process.execPath, ["-e", ""]],
    accountStatus: async () => ({
      state: signedIn ? "signed_in" : "signed_out",
      method: null,
      checkedAt: null,
      message: "fixture",
    }),
    usageProbe: async () => {
      calls++;
      return {
        rateLimits: {
          primary: { usedPercent: 30, windowDurationMins: 300, resetsAt: 2000000000 },
        },
        secret: "DO_NOT_EXPOSE",
      };
    },
  });
  await once(app.server, "listening");
  const usage = () =>
    app.request({ op: "operations" }).adapters.find((a) => a.id === "codex").usage;
  try {
    for (let i = 0; i < 100 && usage().state !== "available"; i++) await sleep(10);
    assert.equal(usage().windows[0].remainingPercent, 70);
    assert.equal(calls, 1);
    assert.doesNotMatch(JSON.stringify(usage()), /DO_NOT_EXPOSE/);
    app.request({ op: "account-refresh" });
    await sleep(30);
    assert.equal(calls, 1);
    signedIn = false;
    app.request({ op: "account-refresh" });
    await sleep(30);
    assert.equal(usage().state, "unavailable");
    assert.deepEqual(usage().windows, []);
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("shutdown aborts an active usage probe and waits for its settlement", async () => {
  const root = mkdtempSync(join(tmpdir(), "usage-close-"));
  let entered, finish, signal;
  const started = new Promise((r) => {
      entered = r;
    }),
    gate = new Promise((r) => {
      finish = r;
    });
  const app = runner({
    stateDir: join(root, "state"),
    repo: repo(root, "repo"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    command: () => [process.execPath, []],
    accountStatus: async () => ({
      state: "signed_in",
      method: null,
      checkedAt: null,
      message: "fixture",
    }),
    usageProbe: async (_root, s) => {
      signal = s;
      entered();
      await gate;
      throw Error("aborted");
    },
  });
  await once(app.server, "listening");
  await started;
  let closed = false;
  const closing = app.close().then(() => {
    closed = true;
  });
  try {
    await sleep(10);
    assert.equal(signal.aborted, true);
    assert.equal(closed, false);
    finish();
    await closing;
  } finally {
    finish();
    await closing;
    rmSync(root, { recursive: true, force: true });
  }
});
