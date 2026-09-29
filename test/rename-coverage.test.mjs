import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { snapshot, filePatch } from "../src/changes.ts";

// A rename must not hide the deletion of its old path from per-file review
// coverage: renaming a test into an unused location disables it silently.
test("renamed files list the deleted old path for review coverage", () => {
  const root = mkdtempSync(join(tmpdir(), "agentd-rename-")),
    repo = join(root, "repo"),
    worktree = join(root, "worktree"),
    state = join(root, "state");
  const git = (cwd, ...args) =>
    execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8" }).trim();
  try {
    mkdirSync(join(repo, "test"), { recursive: true });
    mkdirSync(state);
    const body =
      Array.from(
        { length: 60 },
        (_, i) => `assert.equal(guard(${i}), ${i % 2 === 0});`,
      ).join("\n") + "\n";
    writeFileSync(join(repo, "test/security.test.mjs"), body);
    writeFileSync(join(repo, "big.txt"), "seed\n");
    git(repo, "init", "-q", "-b", "main");
    git(repo, "add", ".");
    git(
      repo,
      "-c",
      "user.name=t",
      "-c",
      "user.email=t@example.invalid",
      "commit",
      "-qm",
      "init",
    );
    const revision = git(repo, "rev-parse", "HEAD");
    git(repo, "worktree", "add", "-q", "--detach", worktree, revision);
    mkdirSync(join(worktree, "test/fixtures"));
    renameSync(
      join(worktree, "test/security.test.mjs"),
      join(worktree, "test/fixtures/security.txt"),
    );
    writeFileSync(
      join(worktree, "test/fixtures/security.txt"),
      body.replace("guard(0)", "guard(99)"),
    );
    // Large unrelated change: the aggregate diff is truncated, so per-file coverage applies.
    writeFileSync(
      join(worktree, "big.txt"),
      Array.from(
        { length: 8000 },
        (_, i) => `line ${i} of a large unrelated change`,
      ).join("\n") + "\n",
    );
    const value = snapshot(worktree, revision, state);
    assert.equal(value.truncated, true);
    assert.deepEqual([...value.files].sort(), [
      "big.txt",
      "test/fixtures/security.txt",
      "test/security.test.mjs",
    ]);
    const deleted = filePatch(worktree, revision, value.tree, "test/security.test.mjs");
    assert.match(deleted.patch, /^deleted file mode/m);
    assert.match(deleted.patch, /^-assert\.equal\(guard\(0\), true\);$/m);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
