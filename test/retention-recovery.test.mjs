import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  realpathSync,
  existsSync,
  symlinkSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { retention } from "../src/retention.ts";

function fixture(run) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "retention-recovery-")));
  const db = new DatabaseSync(":memory:");
  try {
    const repo = join(root, "repo"),
      worktrees = join(root, "trees"),
      logs = join(root, "logs");
    for (const p of [repo, worktrees, logs]) mkdirSync(p);
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
      "CREATE TABLE tasks(id TEXT,conversation TEXT,project TEXT,status TEXT,mode TEXT,review TEXT,updated TEXT,worktree TEXT,log TEXT); CREATE TABLE conversations(id TEXT,archived INTEGER); CREATE TABLE projects(id TEXT,repo TEXT); CREATE TABLE audit(action TEXT,task TEXT);",
    );
    const id = "00000000-0000-4000-8000-000000000001",
      tree = join(worktrees, id),
      log = join(logs, id + ".log"),
      owner = "fixture-owner";
    git("worktree", "add", "--detach", tree, "HEAD");
    writeFileSync(log, "x".repeat(1000));
    writeFileSync(log + ".answer", "saved answer");
    db.prepare("INSERT INTO projects VALUES(?,?)").run("p", repo);
    db.prepare("INSERT INTO conversations VALUES(?,1)").run(id);
    db.prepare("INSERT INTO tasks VALUES(?,?,?,'succeeded','ask',NULL,?,?,?)").run(
      id,
      id,
      "p",
      new Date(Date.now() - 40 * 86400000).toISOString(),
      tree,
      log,
    );
    const audit = (action, task) =>
      db.prepare("INSERT INTO audit VALUES(?,?)").run(action, task);
    const manager = (hook = () => {}) =>
      retention(db, { worktrees, logs }, (action, task) => {
        audit(action, task);
        hook(action);
      });
    run({ db, id, tree, log, owner, git, manager, audit });
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
}

test("interrupted worktree removal needs fresh approval before reconciling its record", () =>
  fixture(({ db, id, tree, log, owner, manager }) => {
    db.exec(
      "CREATE TRIGGER fail_clear BEFORE UPDATE OF worktree ON tasks BEGIN SELECT RAISE(ABORT,'injected persistence failure'); END;",
    );
    const first = manager(),
      plan = first.preview(owner);
    assert.deepEqual(first.apply(owner, plan.fingerprint), { removed: [], errors: [id] });
    assert.equal(existsSync(tree), false);
    assert.equal(db.prepare("SELECT worktree FROM tasks").get().worktree, tree);
    assert.equal(readFileSync(log, "utf8"), "x".repeat(1000));
    db.exec("DROP TRIGGER fail_clear");
    const restarted = manager();
    assert.throws(() => restarted.apply(owner, plan.fingerprint), /expired/);
    const fresh = restarted.preview(owner);
    assert.equal(fresh.items[0].reconcileWorktree, true);
    assert.equal(fresh.items[0].worktree, false);
    assert.equal(db.prepare("SELECT worktree FROM tasks").get().worktree, tree);
    assert.deepEqual(restarted.apply(owner, fresh.fingerprint), {
      removed: [id],
      errors: [],
    });
    assert.equal(db.prepare("SELECT worktree FROM tasks").get().worktree, null);
    assert.equal(readFileSync(log + ".answer", "utf8"), "saved answer");
    assert.equal(restarted.preview(owner).items.length, 0);
  }));

for (const scenario of ["no audit", "registered", "dangling link"]) {
  test(`reconciliation preserves uncertain missing worktree: ${scenario}`, () =>
    fixture(({ tree, id, owner, git, manager, audit }) => {
      if (scenario === "registered") rmSync(tree, { recursive: true });
      else git("worktree", "remove", tree);
      if (scenario !== "no audit") audit("cleanup-start", id);
      if (scenario === "dangling link") symlinkSync(tree + "-absent", tree);
      const plan = manager().preview(owner);
      assert.equal(plan.items.length, 0);
      assert.equal(plan.skipped.length, 1);
    }));
}

test("recreated worktree after recovery preview is preserved", () =>
  fixture(({ tree, id, owner, git, manager, audit }) => {
    git("worktree", "remove", tree);
    audit("cleanup-start", id);
    const clean = manager(),
      plan = clean.preview(owner);
    mkdirSync(tree);
    writeFileSync(join(tree, "keep.txt"), "keep");
    assert.throws(() => clean.apply(owner, plan.fingerprint), /changed/);
    assert.equal(readFileSync(join(tree, "keep.txt"), "utf8"), "keep");
  }));

test("same-size log replacement during cleanup admission is preserved", () =>
  fixture(({ tree, id, log, owner, manager }) => {
    const clean = manager((action) => {
      if (action === "cleanup-start") writeFileSync(log, "y".repeat(1000));
    });
    const plan = clean.preview(owner);
    assert.deepEqual(clean.apply(owner, plan.fingerprint), { removed: [], errors: [id] });
    assert.equal(readFileSync(log, "utf8"), "y".repeat(1000));
    assert.equal(existsSync(tree), true);
  }));
