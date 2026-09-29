import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { localGit, gitEnvironment, GitOutputLimitError } from "../src/git-policy.ts";
import { snapshot } from "../src/changes.ts";
import { repositoryGit } from "../src/repositories.ts";
const plain = (repo, args) =>
  execFileSync("/usr/bin/git", ["-C", repo, ...args], {
    encoding: "utf8",
    stdio: "pipe",
  }).trim();
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "git-policy-")),
    repo = join(root, "repo");
  mkdirSync(repo);
  plain(repo, ["init", "-b", "main"]);
  plain(repo, ["config", "user.name", "test"]);
  plain(repo, ["config", "user.email", "test@localhost"]);
  writeFileSync(join(repo, "README"), "ok");
  plain(repo, ["add", "."]);
  plain(repo, ["commit", "-m", "initial"]);
  return { root, repo };
}
test("shared Git policy denies hooks and inherited executable/config overrides but preserves snapshot exclusions", () => {
  const { root, repo } = fixture(),
    marker = join(root, "hook"),
    tree = join(root, "worktree");
  const previous = process.env.GIT_CONFIG_COUNT;
  try {
    writeFileSync(
      join(repo, ".git/hooks/post-checkout"),
      `#!/bin/sh\ntouch '${marker}'\n`,
      { mode: 0o700 },
    );
    process.env.GIT_CONFIG_COUNT = "bogus";
    localGit(repo, ["worktree", "add", "--detach", tree, "HEAD"]);
    assert.equal(existsSync(marker), false);
    mkdirSync(join(tree, ".agentd-input"));
    writeFileSync(join(tree, ".agentd-input", "secret"), "excluded");
    writeFileSync(join(tree, "new"), "included");
    const value = snapshot(tree, localGit(repo, ["rev-parse", "HEAD"]), root);
    assert.deepEqual(value.files, ["new"]);
    const env = gitEnvironment();
    assert.equal(env.GIT_CONFIG_COUNT, undefined);
    assert.equal(env.GIT_DIR, undefined);
    assert.equal(env.GIT_SSH_COMMAND, undefined);
    assert.equal(env.LD_PRELOAD, undefined);
    assert.throws(() => localGit(repo, ["status"], { GIT_DIR: "/tmp" }), /Unsupported/);
    assert.equal(localGit(repo, ["config", "--get", "protocol.https.allow"]), "never");
  } finally {
    if (previous === undefined) delete process.env.GIT_CONFIG_COUNT;
    else process.env.GIT_CONFIG_COUNT = previous;
    rmSync(root, { recursive: true, force: true });
  }
});
test("shared local and repository Git reject executable drivers, includes and transport rewrites before execution", async () => {
  const { root, repo } = fixture(),
    state = join(root, "state");
  mkdirSync(state);
  const command = repositoryGit({ stateDir: state }),
    signal = new AbortController().signal;
  try {
    for (const key of [
      "filter.evil.clean",
      "merge.evil.driver",
      "diff.evil.textconv",
      "diff.external",
      "include.path",
      "includeIf.gitdir:/.path",
      "url.https://evil.invalid/.insteadOf",
      "http.extraHeader",
      "credential.helper",
    ]) {
      plain(repo, ["config", key, "malicious"]);
      assert.throws(() => localGit(repo, ["status"]), /unsupported/);
      await assert.rejects(command(repo, ["status"], signal), /unsupported/);
      plain(repo, ["config", "--unset-all", key]);
    }
    plain(repo, ["config", "extensions.worktreeConfig", "true"]);
    plain(repo, ["config", "--worktree", "filter.evil.process", "malicious"]);
    assert.throws(() => localGit(repo, ["status"]), /unsupported/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("asynchronous repository Git enforces caller output bounds", async () => {
  const { root, repo } = fixture(),
    state = join(root, "state");
  mkdirSync(state);
  const command = repositoryGit({ stateDir: state });
  try {
    await assert.rejects(
      command(
        repo,
        ["show", "HEAD:README"],
        new AbortController().signal,
        false,
        undefined,
        false,
        false,
        1,
      ),
      GitOutputLimitError,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
