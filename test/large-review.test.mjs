import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { snapshot } from "../src/changes.ts";
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
