import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { filePatch, snapshot } from "../src/changes.ts";
import { gitOutput, GitOutputLimitError } from "../src/git-policy.ts";
test("multi-megabyte diffs return an unapprovable bounded review instead of raw ENOBUFS", () => {
  const root = mkdtempSync(join(tmpdir(), "large-review-")),
    repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) =>
    execFileSync("/usr/bin/git", ["-C", repo, ...args], {
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  try {
    git(["init", "-b", "main"]);
    git(["config", "user.name", "test"]);
    git(["config", "user.email", "test@localhost"]);
    for (const name of ["one.txt", "two.txt"])
      writeFileSync(join(repo, name), "a\n".repeat(524000));
    git(["add", "."]);
    git(["commit", "-m", "before"]);
    const head = git(["rev-parse", "HEAD"]);
    for (const name of ["one.txt", "two.txt"])
      writeFileSync(join(repo, name), "b\n".repeat(524000));
    assert.throws(
      () => gitOutput(repo, ["diff"], { maxBuffer: 4 * 1024 * 1024 }),
      GitOutputLimitError,
    );
    const value = snapshot(repo, head, root);
    assert.equal(value.truncated, true);
    assert.deepEqual(value.blocked, []);
    assert.deepEqual(value.files, ["one.txt", "two.txt"]);
    assert.equal(value.patch, "");
    assert.match(value.summary, /files changed/);
    assert.ok(JSON.stringify(value).length < 2000);
    assert.throws(
      () => gitOutput(repo, ["diff"], { maxBuffer: 100 }),
      (e) => {
        assert.equal(e.stdout, undefined);
        assert.equal(e.stderr, undefined);
        assert.ok(!e.message.includes(repo));
        return e instanceof GitOutputLimitError;
      },
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("oversized aggregate reviews expose bounded exact-tree text files separately", () => {
  const root = mkdtempSync(join(tmpdir(), "large-files-review-")),
    repo = join(root, "repo");
  mkdirSync(repo);
  const git = (args) =>
    execFileSync("/usr/bin/git", ["-C", repo, ...args], {
      encoding: "utf8",
      stdio: "pipe",
    }).trim();
  try {
    git(["init", "-b", "main"]);
    git(["config", "user.name", "test"]);
    git(["config", "user.email", "test@localhost"]);
    for (let i = 0; i < 12; i++)
      writeFileSync(join(repo, `part-${i}.txt`), `before-${i}\n`.repeat(6000));
    git(["add", "."]);
    git(["commit", "-m", "before"]);
    const head = git(["rev-parse", "HEAD"]);
    for (let i = 0; i < 12; i++)
      writeFileSync(join(repo, `part-${i}.txt`), `after-${i}\n`.repeat(6000));
    const overview = snapshot(repo, head, root);
    assert.equal(overview.truncated, true);
    assert.deepEqual(overview.blocked, []);
    const page = filePatch(repo, head, overview.tree, "part-3.txt");
    assert.equal(page.tree, overview.tree);
    assert.equal(page.file, "part-3.txt");
    assert.match(page.patch, /after-3/);
    assert.ok(Buffer.byteLength(page.patch) < 180000);
    assert.throws(
      () => filePatch(repo, head, overview.tree, "not-changed.txt"),
      /not part/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
