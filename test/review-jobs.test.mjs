import { test } from "node:test";
import assert from "node:assert/strict";
import { reviewJobs } from "../src/review-jobs.ts";
import { prepareReview } from "../src/review-preview.ts";
import { git, snapshot } from "../src/changes.ts";
import { mkdtempSync, mkdirSync, writeFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const tick = () => new Promise((r) => setImmediate(r));

test("preview retries recover one owned job; cancellation holds its slot until settlement", async () => {
  let release,
    starts = 0;
  const jobs = reviewJobs(async (_input, signal) => {
    starts++;
    await new Promise((r) => {
      release = r;
    });
    assert.equal(signal.aborted, true);
    return {};
  });
  const a = jobs.start("a", "task", {}, (v) => v);
  assert.equal(jobs.start("a", "task", {}, (v) => v).id, a.id);
  assert.throws(() => jobs.view("b", a.id), /expired/);
  assert.throws(() => jobs.cancel("b", a.id), /expired/);
  assert.throws(() => jobs.start("b", "task", {}, (v) => v), /progress/);
  await tick();
  jobs.cancel("a", a.id);
  assert.equal(jobs.busy(), true);
  release();
  await tick();
  assert.equal(jobs.view("a", a.id).status, "cancelled");
  assert.equal(jobs.view("a", a.id).result, null);
  assert.equal(starts, 1);
  await jobs.close();
});

test("immediate shutdown skips preview work and errors never expose raw diagnostics", async () => {
  let starts = 0;
  const jobs = reviewJobs(async () => {
    starts++;
    return {};
  });
  const job = jobs.start("a", "t", {}, (v) => v);
  await jobs.close();
  assert.equal(starts, 0);
  assert.equal(jobs.view("a", job.id).status, "cancelled");
  assert.throws(() => jobs.start("a", "t", {}, (v) => v), /stopping/);
  const failed = reviewJobs(async () => {
    throw Error("private path and credential diagnostics");
  });
  const bad = failed.start("a", "t", {}, (v) => v);
  await tick();
  assert.equal(failed.view("a", bad.id).status, "failed");
  assert.doesNotMatch(failed.view("a", bad.id).error, /private path/);
  await failed.close();
});

test("background preview matches exact snapshot, yields and removes its temporary index", async () => {
  const root = mkdtempSync(join(tmpdir(), "review-preview-")),
    repo = join(root, "repo"),
    stateDir = join(root, "state");
  try {
    mkdirSync(repo);
    mkdirSync(stateDir);
    git(repo, ["init", "-b", "main"]);
    writeFileSync(join(repo, "README.md"), "before\n");
    git(repo, ["add", "."]);
    git(repo, [
      "-c",
      "user.name=test",
      "-c",
      "user.email=t@example.invalid",
      "commit",
      "-m",
      "fixture",
    ]);
    const revision = git(repo, ["rev-parse", "HEAD"]);
    writeFileSync(join(repo, "README.md"), "after\n");
    let yielded = false;
    setImmediate(() => {
      yielded = true;
    });
    const input = {
      worktree: repo,
      revision,
      stateDir,
      mergeParent: null,
      conflictPaths: [],
    };
    const result = await prepareReview(input, new AbortController().signal);
    assert.equal(yielded, true);
    assert.deepEqual(result, { ...snapshot(repo, revision, stateDir), conflicts: [] });
    assert.deepEqual(readdirSync(stateDir), []);
    const abort = new AbortController();
    const pending = prepareReview(input, abort.signal);
    abort.abort();
    await assert.rejects(pending, /stopped/);
    assert.deepEqual(readdirSync(stateDir), []);
    writeFileSync(join(repo, "README.md"), "newer\n");
    assert.notEqual(snapshot(repo, revision, stateDir).tree, result.tree);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
