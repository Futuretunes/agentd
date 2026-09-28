import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { once } from "node:events";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  realpathSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import {
  checkoutBudget,
  captureOutput,
  resourceLimits,
  monitorWorktree,
  inventory,
  requireSpace,
} from "../src/resources.ts";
import { retention } from "../src/retention.ts";
import { runner } from "../src/runner.ts";

test("combined stdout/stderr is capped and overflow fails the worker", async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "bounded-output-")));
  try {
    let reason;
    const child = spawn(
      process.execPath,
      [
        "-e",
        "process.stdout.write('a'.repeat(4000));process.stderr.write('b'.repeat(4000));setInterval(()=>{},1000)",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    captureOutput(
      child,
      join(root, "run.log"),
      (value) => {
        reason = value;
        child.kill("SIGKILL");
      },
      4096,
      true,
    );
    await once(child, "close");
    assert.equal(reason, "Output limit reached");
    assert.equal(statSync(join(root, "run.log")).size, 4096);
    assert.ok(statSync(join(root, "run.log.answer")).size <= 4096);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("worktree guard ignores linked targets, stops excessive growth and refuses insufficient reserve", async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "growth-")));
  try {
    mkdirSync(join(root, "tree"));
    writeFileSync(join(root, "external"), "x".repeat(1000));
    symlinkSync("../external", join(root, "tree/link"));
    assert.equal(inventory(join(root, "tree")).bytes, 0);
    assert.throws(() => requireSpace([root], Number.MAX_SAFE_INTEGER), /reserve/);
    writeFileSync(join(root, "tree/data"), "over budget");
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error("guard did not fire")), 2000);
      const close = monitorWorktree(
        join(root, "tree"),
        [root],
        (reason) => {
          close();
          clearTimeout(timeout);
          assert.equal(reason, "Worktree size limit reached");
          resolve();
        },
        { ...resourceLimits, worktreeBytes: 1, reserveBytes: 0 },
        20,
      );
    });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("real runner marks noisy tasks failed and preserves their worktree for review", async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "runner-budget-")));
  let app;
  try {
    const repo = join(root, "repo");
    mkdirSync(repo);
    execFileSync("git", ["-C", repo, "init", "-b", "main"], { stdio: "pipe" });
    execFileSync(
      "git",
      [
        "-C",
        repo,
        "-c",
        "user.name=test",
        "-c",
        "user.email=t@example.invalid",
        "commit",
        "--allow-empty",
        "-m",
        "fixture",
      ],
      { stdio: "pipe" },
    );
    app = runner({
      repo,
      stateDir: join(root, "state"),
      worktrees: join(root, "trees"),
      logs: join(root, "logs"),
      resources: { ...resourceLimits, logBytes: 1024, reserveBytes: 0 },
      command: () => [
        process.execPath,
        ["-e", "process.stderr.write('x'.repeat(20000));setInterval(()=>{},1000)"],
      ],
      accountStatus: () => ({
        state: "signed_out",
        method: null,
        checkedAt: null,
        message: "fixture",
      }),
    });
    await once(app.server, "listening");
    const task = app.request({
      op: "create",
      adapter: "claude",
      prompt: "fixture",
    });
    app.request({ op: "approve", id: task.id });
    for (let n = 0; n < 100; n++) {
      if (app.request({ op: "show", id: task.id }).task.status === "failed") break;
      await new Promise((r) => setTimeout(r, 20));
    }
    const row = app.request({ op: "show", id: task.id }).task;
    assert.equal(row.status, "failed");
    assert.equal(row.error, "Output limit reached");
    assert.equal(statSync(row.log).size, 1024);
    assert.ok(statSync(row.worktree).isDirectory());
  } finally {
    await app?.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("retention keeps unresolved/committed/recent work and binds cleanup to owner and inventory", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "retention-"))),
    db = new DatabaseSync(":memory:");
  try {
    const repo = join(root, "repo"),
      trees = join(root, "trees"),
      logs = join(root, "logs");
    for (const p of [repo, trees, logs]) mkdirSync(p);
    const git = (...args) =>
      execFileSync("git", ["-C", repo, ...args], { stdio: "pipe" });
    git("init", "-b", "main");
    git(
      "-c",
      "user.name=test",
      "-c",
      "user.email=t@example.invalid",
      "commit",
      "--allow-empty",
      "-m",
      "fixture",
    );
    db.exec(
      "CREATE TABLE tasks(id TEXT,conversation TEXT,project TEXT,status TEXT,mode TEXT,review TEXT,updated TEXT,worktree TEXT,log TEXT);CREATE TABLE conversations(id TEXT,archived INTEGER);CREATE TABLE projects(id TEXT,repo TEXT);CREATE TABLE audit(action TEXT,task TEXT);",
    );
    db.prepare("INSERT INTO projects VALUES(?,?)").run("p", repo);
    const rows = [];
    for (let n = 0; n < 6; n++) {
      const id = "00000000-0000-4000-8000-" + String(n).padStart(12, "0"),
        tree = join(trees, id),
        log = join(logs, id + ".log");
      git("worktree", "add", "--detach", tree, "HEAD");
      writeFileSync(log, "x".repeat(1000));
      writeFileSync(log + ".answer", "saved answer");
      const status = n === 4 ? "failed" : "succeeded",
        mode = n === 1 || n === 2 ? "edit" : "ask",
        review = n === 1 ? "pending" : n === 2 ? "committed" : null;
      db.prepare("INSERT INTO conversations VALUES(?,?)").run(id, n === 5 ? 0 : 1);
      db.prepare("INSERT INTO tasks VALUES(?,?,?,?,?,?,?,?,?)").run(
        id,
        id,
        "p",
        status,
        mode,
        review,
        new Date(Date.now() - (n === 3 ? 1 : 40) * 86400000).toISOString(),
        tree,
        log,
      );
      rows.push({ id, tree, log });
    }
    const clean = retention(db, { worktrees: trees, logs }, (action, task) =>
      db.prepare("INSERT INTO audit VALUES(?,?)").run(action, task),
    );
    const owner = "a".repeat(64),
      plan = clean.preview(owner);
    assert.deepEqual(
      plan.items.map((x) => x.id),
      [rows[0].id],
    );
    assert.throws(() => clean.apply("b".repeat(64), plan.fingerprint), /expired/);
    writeFileSync(rows[0].log, "changed".repeat(100));
    assert.throws(() => clean.apply(owner, plan.fingerprint), /changed/);
    const fresh = clean.preview(owner),
      result = clean.apply(owner, fresh.fingerprint);
    assert.deepEqual(result.removed, [rows[0].id]);
    assert.deepEqual(result.errors, []);
    assert.equal(
      db.prepare("SELECT worktree FROM tasks WHERE id=?").get(rows[0].id).worktree,
      null,
    );
    assert.match(readFileSync(rows[0].log, "utf8"), /removed by approved/);
    assert.equal(readFileSync(rows[0].log + ".answer", "utf8"), "saved answer");
    for (const row of rows.slice(1)) assert.ok(statSync(row.tree).isDirectory());
    assert.equal(clean.preview(owner).items.length, 0);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test("checkout rejects oversized tracked trees before writing a worktree", () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "checkout-budget-")));
  try {
    const git = (...args) =>
      execFileSync("git", ["-C", root, ...args], { stdio: "pipe" });
    git("init", "-b", "main");
    writeFileSync(join(root, "data"), "x".repeat(2000));
    git("add", ".");
    git(
      "-c",
      "user.name=test",
      "-c",
      "user.email=t@example.invalid",
      "commit",
      "-m",
      "fixture",
    );
    assert.equal(checkoutBudget(root, "HEAD"), 2000);
    assert.throws(
      () =>
        checkoutBudget(root, "HEAD", {
          ...resourceLimits,
          worktreeBytes: 1000,
        }),
      /before checkout/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
