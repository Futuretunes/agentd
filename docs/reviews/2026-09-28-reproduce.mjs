// Bounded diagnostic fixtures for the v0.19.0 review, not acceptance tests.
// No live accounts, provider calls, production data or host configuration changes.
// Run from the reviewed checkout: node docs/reviews/2026-09-28-reproduce.mjs
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import { runner } from "../../src/runner.ts";
import { git, snapshot } from "../../src/changes.ts";
import { isolated } from "../../src/isolation.ts";
const root = mkdtempSync(join(tmpdir(), "agentd-review-"));
const out = (id, data) => console.log(JSON.stringify({ id, ...data }));
function setup(name) {
  const repo = join(root, name),
    state = join(root, name + "-state");
  mkdirSync(repo);
  mkdirSync(state);
  git(repo, ["init", "-b", "main"]);
  writeFileSync(join(repo, "README.md"), "base\n");
  writeFileSync(join(repo, ".gitignore"), "dist/\n");
  writeFileSync(
    join(repo, "package.json"),
    JSON.stringify({ scripts: { test: "node test.cjs" } }),
  );
  writeFileSync(join(repo, "package-lock.json"), "{}");
  writeFileSync(
    join(repo, "test.cjs"),
    "if(require('./dist/impl.cjs')!==42)process.exit(1);\n",
  );
  git(repo, ["add", "."]);
  git(repo, [
    "-c",
    "user.name=fixture",
    "-c",
    "user.email=fixture@localhost",
    "commit",
    "-m",
    "base",
  ]);
  return { repo, state, revision: git(repo, ["rev-parse", "HEAD"]) };
}
const pause = () => new Promise((r) => setTimeout(r, 20));
async function wait(fn) {
  for (let i = 0; i < 500; i++) {
    const v = fn();
    if (v) return v;
    await pause();
  }
  throw Error("Fixture timed out");
}
try {
  const f = setup("checks"),
    deps = join(root, "deps");
  mkdirSync(deps);
  const config = {
    repo: f.repo,
    stateDir: f.state,
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    editing: true,
    editAdapters: ["claude"],
    enabledAdapters: ["claude"],
    accountStatus: async () => ({
      state: "signed_out",
      method: null,
      message: "Fixture",
      checkedAt: null,
    }),
    command: () => [
      process.execPath,
      [
        "-e",
        "const fs=require('fs');fs.mkdirSync('dist');fs.writeFileSync('dist/impl.cjs','module.exports=42');fs.appendFileSync('README.md','reviewed edit\\n');",
      ],
    ],
    isolate: (tree, state, command, args, adapter, dependencies) =>
      adapter || process.platform !== "linux"
        ? { command, args, cleanup() {} }
        : isolated(tree, state, command, args, undefined, dependencies),
  };
  let app = runner(config);
  await once(app.server, "listening");
  try {
    // R4 is fixed; desired behavior is covered by test/check-snapshot.test.mjs.
    const first = app.request({
        op: "create",
        adapter: "claude",
        prompt: "duplicate request",
      }),
      second = app.request({
        op: "create",
        adapter: "claude",
        prompt: "duplicate request",
      });
    out("R10", {
      sameRequestCreatesDifferentConversations:
        first.conversation !== second.conversation,
    });
  } finally {
    await app.close();
  }
  const db = new DatabaseSync(join(f.state, "tasks.sqlite"));
  db.exec("PRAGMA user_version=999");
  db.close();
  app = runner(config);
  await once(app.server, "listening");
  await app.close();
  out("R9", { acceptedFutureUserVersion: 999 });
  const text = setup("text");
  writeFileSync(
    join(text.repo, "README.md"),
    "Documentation mentions Binary files in a sentence.\n",
  );
  out("R14", {
    textOnlyBlocked: snapshot(text.repo, text.revision, text.state).blocked,
  });
  for (const name of [
    ".npmrc",
    ".netrc",
    ".git-credentials",
    "id_ecdsa",
    "certificate.p12",
    ".pypirc",
  ])
    writeFileSync(join(text.repo, name), "fixture-not-a-secret");
  mkdirSync(join(text.repo, ".aws"));
  writeFileSync(join(text.repo, ".aws/credentials"), "fixture-not-a-secret");
  writeFileSync(join(text.repo, "README.md"), "ordinary text\n");
  const sensitive = snapshot(text.repo, text.revision, text.state);
  out("R13", { listedFiles: sensitive.files, blocked: sensitive.blocked });
  writeFileSync(join(text.repo, "large.txt"), "x".repeat(100) + "\n".repeat(1));
  writeFileSync(
    join(text.repo, "large.txt"),
    ("x".repeat(100) + "\n").repeat(50000),
  );
  try {
    snapshot(text.repo, text.revision, text.state);
    out("R15", { unexpected: "no buffer error" });
  } catch (e) {
    out("R15", { code: e.code });
    assert.equal(e.code, "ENOBUFS");
  }
  const hooks = setup("hooks"),
    hookdir = join(root, "fixture-hooks"),
    marker = join(root, "hook-marker");
  mkdirSync(hookdir);
  writeFileSync(
    join(hookdir, "post-checkout"),
    '#!/bin/sh\nprintf hook > "' + marker + '"\n',
  );
  chmodSync(join(hookdir, "post-checkout"), 0o700);
  git(hooks.repo, ["config", "core.hooksPath", hookdir]);
  execFileSync(
    "git",
    [
      "-C",
      hooks.repo,
      "worktree",
      "add",
      "--detach",
      join(root, "unhardened-tree"),
      "HEAD",
    ],
    { stdio: "pipe" },
  );
  assert.equal(existsSync(marker), true);
  rmSync(marker);
  git(hooks.repo, [
    "worktree",
    "add",
    "--detach",
    join(root, "hardened-tree"),
    "HEAD",
  ]);
  out("R12", {
    runnerStyleInvokesLocalHook: true,
    hardenedHelperInvokesLocalHook: existsSync(marker),
  });
  if (process.platform === "linux") {
    const box = isolated(
      hooks.repo,
      hooks.state,
      "/bin/sh",
      [
        "-c",
        "sed -n '/^CapEff:/p;/^CapBnd:/p' /proc/self/status; readlink /proc/self/ns/user; unshare -Ur true >/dev/null 2>&1; echo nested_userns_exit=$?",
      ],
      undefined,
      undefined,
      false,
    );
    try {
      const r = spawnSync(box.command, box.args, {
        encoding: "utf8",
        timeout: 10000,
      });
      assert.equal(r.status, 0);
      out("R7", { observed: r.stdout.trim() });
    } finally {
      box.cleanup();
    }
  }
} finally {
  rmSync(root, { recursive: true, force: true });
}
