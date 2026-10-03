import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  linkSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  statSync,
  symlinkSync,
  truncateSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { request as httpsRequest } from "node:https";
import { runner } from "../src/runner.ts";
import { mobile } from "../src/mobile.ts";
import { publicError } from "../src/public-errors.ts";
import {
  detectStackHints,
  inspectLocalFolder,
  localFolderErrors,
  previewView,
  resolveLocalFolderPath,
} from "../src/local-folder-import.ts";
import { localFolderJobErrors } from "../src/local-folder-jobs.ts";
import { gate, waitFor } from "./helpers.mjs";

const owner = "a".repeat(64),
  stranger = "b".repeat(64);
// Fixtures must not inherit the developer's global Git configuration or templates, and
// must not start detached auto-maintenance that writes into .git after a command returns.
const gitEnv = {
  ...process.env,
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
};
const git = (cwd, ...args) =>
  execFileSync(
    "git",
    ["-c", "maintenance.auto=false", "-c", "gc.auto=0", "-C", cwd, ...args],
    {
      stdio: "pipe",
      encoding: "utf8",
      env: gitEnv,
    },
  );
function commitAll(path) {
  git(path, "add", ".");
  git(
    path,
    "-c",
    "user.name=t",
    "-c",
    "user.email=t@localhost",
    "commit",
    "-qm",
    "fixture",
  );
}
function makeRepo(path) {
  mkdirSync(path, { recursive: true });
  git(path, "init", "-q", "-b", "main");
  writeFileSync(join(path, "README.md"), "fixture\n");
  commitAll(path);
  return path;
}
function sandbox(prefix) {
  const base = realpathSync(mkdtempSync(join(tmpdir(), prefix))),
    roots = join(base, "allowed");
  mkdirSync(roots);
  return { base, roots, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}
function folder(roots, name, files = {}) {
  const path = join(roots, name);
  mkdirSync(path, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    mkdirSync(join(path, rel, ".."), { recursive: true });
    writeFileSync(join(path, rel), content);
  }
  return path;
}
const inspect = (path, roots, protectedPaths = []) =>
  inspectLocalFolder({ path, name: "Project", roots: [roots], protectedPaths });
const message = (error) => String(error?.message);
const throwsFixed = (fn, expected) =>
  assert.throws(fn, (error) => message(error) === expected, expected);
const snapshotFiles = (dir) => {
  const out = {};
  const visit = (rel) => {
    for (const entry of readdirSync(join(dir, rel), { withFileTypes: true })) {
      const child = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) visit(child);
      else
        out[child] = createHash("sha256")
          .update(readFileSync(join(dir, child)))
          .digest("hex");
    }
  };
  visit("");
  return out;
};
const signedOut = async () => ({
  state: "signed_out",
  method: null,
  checkedAt: null,
  message: "Sign-in required",
});
async function service(box, extra = {}) {
  const origin = join(box.base, "origin");
  if (!existsSync(origin)) makeRepo(origin);
  const app = runner({
    stateDir: join(box.base, "state"),
    repo: origin,
    worktrees: join(box.base, "trees"),
    logs: join(box.base, "logs"),
    projectsDir: join(box.base, "projects"),
    localProjectRoots: [box.roots],
    command: () => [process.execPath, ["-e", "setInterval(()=>{},1000)"]],
    accountStatus: signedOut,
    ...extra,
  });
  await once(app.server, "listening");
  return app;
}
const jobOf = (app, id) =>
  app.request({ op: "local-folder-jobs" }).jobs.find((j) => j.id === id);
const settled = (app, id, states) =>
  waitFor(
    () => {
      const job = jobOf(app, id);
      return job && states.includes(job.state) && !job.canCancel ? job : null;
    },
    { what: `job ${states.join("/")}` },
  );
const halted = (app, id, phase) =>
  waitFor(
    () => {
      const job = jobOf(app, id);
      return job?.state === "running" && job.phase === phase && !job.canCancel
        ? job
        : null;
    },
    { what: `halt at ${phase}` },
  );
const preview = (app, path, name = "Project", who = owner) =>
  app.request({ op: "local-folder-preview", owner: who, name, path });
const approve = (app, plan, who = owner) =>
  app.request({ op: "local-folder-approve", owner: who, fingerprint: plan.fingerprint });
const tree = (path) =>
  git(path, "ls-tree", "-r", "--name-only", "HEAD").trim().split("\n");

test("detectStackHints reads manifests deterministically", () => {
  assert.deepEqual(detectStackHints(["package.json", "Cargo.toml"]), [
    "Node.js / npm",
    "Rust",
  ]);
});

test("repository boundaries: parent, nested, worktree, bare, incomplete and symlinked .git", () => {
  const box = sandbox("lf-boundary-");
  try {
    const parent = makeRepo(join(box.roots, "parent"));
    folder(parent, "sub", { "x.txt": "x\n" });
    mkdirSync(join(parent, "empty-sub"));
    throwsFixed(
      () => inspect(join(parent, "sub"), box.roots),
      localFolderErrors.parentRepository,
    );
    throwsFixed(
      () => inspect(join(parent, "empty-sub"), box.roots),
      localFolderErrors.parentRepository,
    );
    // A path inside a repository's metadata is never a project root.
    assert.throws(
      () => inspect(join(parent, ".git", "objects"), box.roots),
      (error) =>
        [localFolderErrors.parentRepository, localFolderErrors.bare].includes(
          message(error),
        ),
    );

    const plain = folder(box.roots, "plain", { "a.txt": "a\n" });
    makeRepo(join(plain, "inner"));
    throwsFixed(() => inspect(plain, box.roots), localFolderErrors.nested);
    const deep = folder(box.roots, "deep", { "a.txt": "a\n" });
    makeRepo(join(deep, "one", "two"));
    throwsFixed(() => inspect(deep, box.roots), localFolderErrors.nested);
    const nestedInRepo = makeRepo(join(box.roots, "outer"));
    makeRepo(join(nestedInRepo, "child"));
    throwsFixed(() => inspect(nestedInRepo, box.roots), localFolderErrors.nested);

    const main = makeRepo(join(box.roots, "main"));
    git(main, "worktree", "add", "-q", join(box.roots, "linked"));
    throwsFixed(
      () => inspect(join(box.roots, "linked"), box.roots),
      localFolderErrors.gitIndirection,
    );

    git(box.roots, "init", "-q", "--bare", "bare.git");
    throwsFixed(
      () => inspect(join(box.roots, "bare.git"), box.roots),
      localFolderErrors.bare,
    );
    throwsFixed(
      () => inspect(join(box.roots, "bare.git", "refs"), box.roots),
      localFolderErrors.bare,
    );

    const emptyBroken = folder(box.roots, "empty-broken");
    mkdirSync(join(emptyBroken, ".git"));
    throwsFixed(() => inspect(emptyBroken, box.roots), localFolderErrors.incompleteGit);
    const fullBroken = folder(box.roots, "full-broken", {
      "a.txt": "a\n",
      ".git/HEAD": "ref: x\n",
    });
    throwsFixed(() => inspect(fullBroken, box.roots), localFolderErrors.incompleteGit);

    const linkedGit = folder(box.roots, "linked-git", { "a.txt": "a\n" });
    symlinkSync(join(main, ".git"), join(linkedGit, ".git"));
    throwsFixed(() => inspect(linkedGit, box.roots), localFolderErrors.gitSymlink);

    const unborn = folder(box.roots, "unborn");
    git(unborn, "init", "-q", "-b", "main");
    throwsFixed(() => inspect(unborn, box.roots), localFolderErrors.noCommit);
    const alternates = makeRepo(join(box.roots, "alternates"));
    writeFileSync(
      join(alternates, ".git", "objects", "info", "alternates"),
      "/elsewhere\n",
    );
    throwsFixed(() => inspect(alternates, box.roots), localFolderErrors.gitIndirection);
  } finally {
    box.cleanup();
  }
});

test("ignore rules apply before inspection; ignored trees never consume limits", () => {
  const box = sandbox("lf-ignore-");
  try {
    const path = folder(box.roots, "app", {
      ".gitignore": "node_modules/\n.venv/\ntarget/\ndist/\n.env\n",
      "README.md": "hello\n",
      "src/index.js": "export default 1;\n",
      ".env": "TOKEN=ignored-secret-value\n",
      "dist/big.bin": Buffer.alloc(2 * 1024 * 1024, 1),
      "target/debug/app": Buffer.from([0, 1, 2, 3]),
    });
    for (let i = 0; i < 1100; i++)
      folder(path, `node_modules/pkg${i}`, { "index.js": "x\n" });
    symlinkSync("/", join(path, "node_modules", "escape"));
    mkdirSync(join(path, ".venv", "bin"), { recursive: true });
    symlinkSync("/usr/bin/python3", join(path, ".venv", "bin", "python"));
    makeRepo(join(path, "node_modules", "vendored"));
    const result = inspect(path, box.roots);
    assert.equal(result.case, "non_git");
    assert.equal(result.blocked, false);
    assert.deepEqual(
      result.candidates.map((c) => c.path),
      [".gitignore", "README.md", "src/index.js"],
    );
    for (const entry of [".env", ".venv/", "dist/", "node_modules/", "target/"])
      assert.ok(result.ignored.includes(entry), entry);
    const view = previewView(result, {
      fingerprint: "f",
      expiresAt: "t",
      name: "Project",
    });
    assert.equal(view.ignored.sensitive, 1);
    assert.ok(view.ignored.groups.some((g) => g.entry === "node_modules/"));
    assert.equal(JSON.stringify(view).includes("ignored-secret-value"), false);
    assert.deepEqual(
      view.handover.map((h) => h.path),
      ["AGENTS.md", "docs/handover.md"],
    );
    assert.ok(view.gitOperations.some((op) => op.startsWith("git init")));
    assert.equal(view.willCreateInitialCommit, true);
  } finally {
    box.cleanup();
  }
});

test("candidate symlinks, special, unreadable, binary, oversized, sparse and hard-linked files block", () => {
  const box = sandbox("lf-refuse-");
  try {
    const path = folder(box.roots, "odd", {
      "ok.txt": "fine\n",
      "nul.txt": Buffer.from("text\0more"),
      "latin1.txt": Buffer.from([0xff, 0xfe, 0x41]),
      "huge.txt": Buffer.alloc(1024 * 1024 + 1, 0x61),
      "sparse.txt": "",
      "linked-a.txt": "same inode\n",
    });
    truncateSync(join(path, "sparse.txt"), 900 * 1024);
    linkSync(join(path, "linked-a.txt"), join(path, "linked-b.txt"));
    symlinkSync("ok.txt", join(path, "alias.txt"));
    execFileSync("mkfifo", [join(path, "pipe")]);
    const unprivileged = process.getuid?.() !== 0;
    if (unprivileged) {
      writeFileSync(join(path, "locked.txt"), "x\n");
      chmodSync(join(path, "locked.txt"), 0);
    }
    const result = inspect(path, box.roots);
    const reasons = Object.fromEntries(result.refused.map((r) => [r.path, r.reason]));
    assert.equal(reasons["alias.txt"], "symbolic link");
    assert.equal(reasons["pipe"], "special file");
    assert.equal(reasons["nul.txt"], "binary content");
    assert.equal(reasons["latin1.txt"], "binary content");
    assert.equal(reasons["huge.txt"], "too large to scan");
    assert.equal(reasons["linked-a.txt"], "hard link");
    assert.equal(reasons["linked-b.txt"], "hard link");
    if (statSync(join(path, "sparse.txt")).blocks * 512 + 65536 < 900 * 1024)
      assert.equal(reasons["sparse.txt"], "sparse file");
    if (unprivileged) assert.equal(reasons["locked.txt"], "unreadable");
    assert.deepEqual(
      result.candidates.map((c) => c.path).filter((p) => p !== "sparse.txt"),
      ["ok.txt"],
    );
    assert.equal(result.blocked, true);
    if (unprivileged) chmodSync(join(path, "locked.txt"), 0o600);
  } finally {
    box.cleanup();
  }
});

test("credential filenames and credential content block instead of being excluded", () => {
  const box = sandbox("lf-sensitive-");
  try {
    const path = folder(box.roots, "creds", {
      "README.md": "ok\n",
      id_rsa: "not really a key\n",
      ".env.local": "A=1\n",
      "config.js": `export const key = "AKIA${"ABCDEFGHIJKLMNOP"}";\n`,
    });
    const result = inspect(path, box.roots);
    const findings = Object.fromEntries(result.findings.map((f) => [f.path, f.reasons]));
    assert.deepEqual(findings["id_rsa"], ["sensitive filename"]);
    assert.deepEqual(findings[".env.local"], ["sensitive filename"]);
    assert.deepEqual(findings["config.js"], ["cloud access credential"]);
    assert.equal(result.blocked, true);
    const view = previewView(result, {
      fingerprint: "f",
      expiresAt: "t",
      name: "Project",
    });
    assert.equal(JSON.stringify(view).includes("ABCDEFGHIJKLMNOP"), false);
  } finally {
    box.cleanup();
  }
});

test("protected account, profile and AgentD locations stay refused below allowed roots", () => {
  const box = sandbox("lf-protected-");
  try {
    for (const rel of [
      "home/.ssh/project",
      "home/.aws/project",
      "home/.gnupg/project",
      "home/.config/gh/project",
      "home/.claude/project",
      "home/.codex/project",
      "home/.cursor/project",
      "home/.agentd/project",
      "home/.local/share/agentd/project",
    ]) {
      const path = folder(box.roots, rel, { "a.txt": "a\n" });
      throwsFixed(() => inspect(path, box.roots), localFolderErrors.protected);
    }
    for (const material of [
      ".ssh/config",
      ".codex/auth.json",
      ".claude/.credentials.json",
      ".netrc",
    ]) {
      const home = folder(box.roots, `user-${material.replace(/[^a-z]/g, "")}`, {
        [material]: "x\n",
      });
      throwsFixed(() => inspect(home, box.roots), localFolderErrors.accountMaterial);
    }
    const state = folder(box.roots, "agentd-state/inner", { "a.txt": "a\n" });
    throwsFixed(
      () => inspect(state, box.roots, [join(box.roots, "agentd-state")]),
      localFolderErrors.protected,
    );
    throwsFixed(
      () => inspect(join(box.roots), box.roots, [join(box.roots, "agentd-state")]),
      localFolderErrors.protected,
    );
    throwsFixed(
      () => resolveLocalFolderPath("/usr", ["/"], []),
      localFolderErrors.protected,
    );
    throwsFixed(
      () => resolveLocalFolderPath(box.base, [box.roots], []),
      localFolderErrors.outsideRoots,
    );
    throwsFixed(
      () => resolveLocalFolderPath(box.roots, [], []),
      localFolderErrors.noRoots,
    );
    symlinkSync(join(box.roots, "home"), join(box.roots, "link"));
    throwsFixed(
      () => resolveLocalFolderPath(join(box.roots, "link"), [box.roots], []),
      localFolderErrors.symlink,
    );
  } finally {
    box.cleanup();
  }
});

test("existing repositories are vetted read-only and fail closed on unsafe configuration", () => {
  const box = sandbox("lf-existing-");
  try {
    const unsafe = [
      ["core.hooksPath", "hooks"],
      ["core.sshCommand", "ssh -i key"],
      ["core.fsmonitor", "run-me"],
      ["include.path", "other.config"],
      ["filter.lfs.clean", "run-me"],
      ["diff.tool.textconv", "run-me"],
      ["merge.ours.driver", "run-me"],
      ["url.https://mirror.example/.insteadOf", "https://github.com/"],
      ["http.proxy", "http://proxy.example"],
      ["credential.helper", "store"],
      ["alias.st", "!run-me"],
      ["remote.origin.url", "https://user:secret@example.com/x.git"],
      ["remote.origin.url", "ext::run-me"],
      ["remote.origin.uploadpack", "run-me"],
    ];
    unsafe.forEach(([key, value], i) => {
      const repo = makeRepo(join(box.roots, `unsafe-${i}`));
      git(repo, "config", key, value);
      throwsFixed(() => inspect(repo, box.roots), localFolderErrors.unsafeConfig);
    });
    const allowed = makeRepo(join(box.roots, "allowed-config"));
    git(allowed, "config", "core.fsmonitor", "false");
    git(allowed, "config", "remote.origin.url", "https://github.com/example/repo.git");
    assert.equal(inspect(allowed, box.roots).case, "existing_git");
    const hooked = makeRepo(join(box.roots, "hooked"));
    writeFileSync(join(hooked, ".git", "hooks", "pre-commit"), "#!/bin/sh\nexit 0\n", {
      mode: 0o755,
    });
    throwsFixed(() => inspect(hooked, box.roots), localFolderErrors.hooks);

    const dirty = makeRepo(join(box.roots, "dirty"));
    writeFileSync(join(dirty, "README.md"), "changed\n");
    writeFileSync(join(dirty, "AGENTS.md"), "keep\n");
    const before = snapshotFiles(join(dirty, ".git"));
    const result = inspect(dirty, box.roots);
    assert.deepEqual(
      snapshotFiles(join(dirty, ".git")),
      before,
      "inspection must not write Git metadata",
    );
    assert.equal(result.case, "existing_git");
    assert.equal(result.existing.dirty, true);
    assert.deepEqual(result.handover, []);
    assert.equal(result.willCreateInitialCommit, false);
    assert.deepEqual(result.gitOperations, [
      "Register the existing repository in place",
      "No Git command changes the repository, index, branch, remotes or working files",
    ]);
    writeFileSync(join(dirty, ".env"), "SECRET=1\n");
    const withSecret = inspect(dirty, box.roots);
    assert.equal(withSecret.blocked, true);
    assert.deepEqual(withSecret.findings, [
      { path: ".env", reasons: ["sensitive untracked file"] },
    ]);
  } finally {
    box.cleanup();
  }
});

test("a same-size edit with restored timestamps changes the content-bound snapshot", () => {
  const box = sandbox("lf-snapshot-");
  try {
    const path = folder(box.roots, "same", { "a.txt": "aaaa\n" });
    const first = inspect(path, box.roots).snapshot;
    const { atime, mtime } = statSync(join(path, "a.txt"));
    writeFileSync(join(path, "a.txt"), "bbbb\n");
    utimesSync(join(path, "a.txt"), atime, mtime);
    assert.notEqual(inspect(path, box.roots).snapshot, first);
    chmodSync(join(path, "a.txt"), 0o755);
    const executable = inspect(path, box.roots);
    assert.equal(executable.candidates[0].mode, "100755");
    assert.notEqual(executable.snapshot, first);
  } finally {
    box.cleanup();
  }
});

test("approved imports run asynchronously, commit exactly the verified bytes and are idempotent", async () => {
  const box = sandbox("lf-apply-");
  const app = await service(box);
  try {
    const path = folder(box.roots, "app", {
      ".gitignore": ".env\nnode_modules/\n",
      ".env": "TOKEN=abc\n",
      "src/a.js": "export const a = 1;\n",
      "bin/run.sh": "#!/bin/sh\necho ok\n",
      "node_modules/x/index.js": "x\n",
    });
    chmodSync(join(path, "bin/run.sh"), 0o755);
    const plan = preview(app, path, "App");
    assert.deepEqual(
      plan.files.items.map((f) => f.path),
      [".gitignore", "bin/run.sh", "src/a.js"],
    );
    assert.equal(plan.canonicalPath, path);
    assert.equal(plan.blocked, false);
    const job = approve(app, plan);
    assert.equal(job.state, "running");
    assert.equal(
      approve(app, plan).id,
      job.id,
      "a repeated approval returns the same job",
    );
    const done = await settled(app, job.id, ["succeeded"]);
    assert.deepEqual(tree(path), [
      ".gitignore",
      "AGENTS.md",
      "bin/run.sh",
      "docs/handover.md",
      "src/a.js",
    ]);
    assert.equal(git(path, "ls-files", "-s", "bin/run.sh").slice(0, 6), "100755");
    assert.equal(
      readFileSync(join(path, "AGENTS.md"), "utf8"),
      plan.handover.find((h) => h.path === "AGENTS.md").content,
    );
    assert.equal(git(path, "status", "--porcelain"), "");
    assert.equal(
      git(path, "log", "--format=%s").trim(),
      "Initialize local AgentD project",
    );
    assert.ok(
      app
        .request({ op: "projects" })
        .some((p) => p.id === done.project && p.repo === path),
    );
    assert.equal(approve(app, plan).state, "succeeded");
    const audits = JSON.stringify(
      app
        .request({ op: "audit" })
        .filter((a) => String(a.action).startsWith("local-folder")),
    );
    assert.match(audits, /registered/);
    assert.equal(audits.includes(box.base), false);
    assert.equal(audits.includes(".env"), false);

    const empty = folder(box.roots, "empty");
    const emptyPlan = preview(app, empty, "Empty");
    assert.equal(emptyPlan.case, "empty");
    await settled(app, approve(app, emptyPlan).id, ["succeeded"]);
    assert.deepEqual(tree(empty), ["AGENTS.md", "docs/handover.md"]);

    const existing = makeRepo(join(box.roots, "existing"));
    writeFileSync(join(existing, "AGENTS.md"), "keep me\n");
    writeFileSync(join(existing, "README.md"), "dirty\n");
    const metadata = snapshotFiles(join(existing, ".git")),
      work = snapshotFiles(existing);
    const gitPlan = preview(app, existing, "Existing");
    assert.deepEqual(gitPlan.handover, []);
    assert.equal(gitPlan.dirty, true);
    assert.equal(gitPlan.willCreateInitialCommit, false);
    await settled(app, approve(app, gitPlan).id, ["succeeded"]);
    assert.deepEqual(snapshotFiles(existing), work);
    assert.deepEqual(snapshotFiles(join(existing, ".git")), metadata);
    throwsFixed(
      () => approve(app, preview(app, existing, "Again")),
      localFolderJobErrors.duplicate,
    );
  } finally {
    await app.close();
    box.cleanup();
  }
});

test("blocked previews cannot be approved and content replaced after preview expires approval", async () => {
  const box = sandbox("lf-stale-");
  const app = await service(box);
  try {
    const secret = folder(box.roots, "secret", { "a.txt": "a\n", id_ed25519: "k\n" });
    const blockedPlan = preview(app, secret);
    assert.equal(blockedPlan.blocked, true);
    throwsFixed(() => approve(app, blockedPlan), localFolderErrors.blocked);
    assert.equal(existsSync(join(secret, ".git")), false);

    const path = folder(box.roots, "same", { "a.txt": "aaaa\n", "keep.md": "mine\n" });
    const before = snapshotFiles(path);
    const plan = preview(app, path);
    const { atime, mtime } = statSync(join(path, "a.txt"));
    writeFileSync(join(path, "a.txt"), "bbbb\n");
    utimesSync(join(path, "a.txt"), atime, mtime);
    const job = await settled(app, approve(app, plan).id, ["failed"]);
    assert.equal(job.error, localFolderErrors.changedAfterPreview);
    assert.equal(existsSync(join(path, ".git")), false);
    assert.equal(existsSync(join(path, "AGENTS.md")), false);
    assert.deepEqual(Object.keys(snapshotFiles(path)).sort(), Object.keys(before).sort());
  } finally {
    await app.close();
    box.cleanup();
  }
});

test("interruption after each mutation phase is recoverable by resume or verified rollback", async () => {
  const box = sandbox("lf-recover-");
  const halts = new Map();
  let app = await service(box, {
    localFolderInterrupt: (phase, job) => halts.get(job) === phase,
  });
  const pending = [];
  try {
    for (const phase of ["git_initialized", "handover_created", "committed"]) {
      for (const action of ["resume", "rollback"]) {
        const path = folder(box.roots, `${phase}-${action}`, {
          "notes.md": "pre-existing\n",
          "docs/keep.md": "pre-existing docs\n",
        });
        const original = snapshotFiles(path);
        const plan = preview(app, path, `${phase} ${action}`);
        // Pre-existing docs/ is kept, so only the handover file is created there.
        assert.deepEqual(
          plan.handover.map((h) => h.path),
          ["AGENTS.md", "docs/handover.md"],
        );
        const id = approve(app, plan).id;
        halts.set(id, phase);
        await halted(app, id, phase);
        pending.push({ id, path, phase, action, original });
      }
    }
    await app.close();
    app = await service(box);
    for (const item of pending) {
      const job = jobOf(app, item.id);
      assert.equal(job.state, "recovery_required", item.phase);
      assert.equal(job.error, localFolderJobErrors.interrupted);
      assert.equal(job.needsRecovery, true);
      throwsFixed(
        () => approve(app, preview(app, item.path)),
        localFolderJobErrors.needsRecovery,
      );
    }
    for (const item of pending) {
      app.request({ op: "local-folder-recover", job: item.id, action: item.action });
      const job = await settled(app, item.id, [
        "succeeded",
        "rolled_back",
        "recovery_required",
        "failed",
      ]);
      if (item.action === "resume") {
        assert.equal(job.state, "succeeded", item.phase);
        assert.deepEqual(tree(item.path), [
          "AGENTS.md",
          "docs/handover.md",
          "docs/keep.md",
          "notes.md",
        ]);
        assert.ok(app.request({ op: "projects" }).some((p) => p.repo === item.path));
      } else {
        assert.equal(job.state, "rolled_back", item.phase);
        assert.deepEqual(
          snapshotFiles(item.path),
          item.original,
          `${item.phase} rollback`,
        );
        assert.equal(existsSync(join(item.path, ".git")), false);
        assert.equal(
          existsSync(join(item.path, "docs")),
          true,
          "pre-existing folders stay",
        );
      }
      throwsFixed(
        () => app.request({ op: "local-folder-recover", job: item.id, action: "resume" }),
        localFolderJobErrors.notRecoverable,
      );
    }
  } finally {
    await app.close();
    box.cleanup();
  }
});

test("rollback removes only AgentD-created empty folders and refuses unverifiable changes", async () => {
  const box = sandbox("lf-rollback-");
  const halts = new Map();
  let app = await service(box, {
    localFolderInterrupt: (phase, job) => halts.get(job) === phase,
  });
  try {
    const path = folder(box.roots, "edited", { "a.txt": "a\n" });
    const plan = preview(app, path);
    assert.deepEqual(
      plan.gitOperations.filter((op) => op.startsWith("Create directory")),
      ["Create directory docs/"],
    );
    const id = approve(app, plan).id;
    halts.set(id, "handover_created");
    await halted(app, id, "handover_created");
    writeFileSync(join(path, "AGENTS.md"), "operator edited this\n");
    await app.close();
    app = await service(box);
    app.request({ op: "local-folder-recover", job: id, action: "rollback" });
    const job = await settled(app, id, ["recovery_required", "rolled_back"]);
    assert.equal(job.state, "recovery_required");
    assert.equal(job.error, localFolderJobErrors.partial);
    assert.equal(readFileSync(join(path, "AGENTS.md"), "utf8"), "operator edited this\n");
    assert.equal(existsSync(join(path, "a.txt")), true);
  } finally {
    await app.close();
    box.cleanup();
  }
});

test("a root replaced by a symlink between phases is refused and never written through", async () => {
  const box = sandbox("lf-swap-");
  const halts = new Map();
  let app = await service(box, {
    localFolderInterrupt: (phase, job) => halts.get(job) === phase,
  });
  try {
    const path = folder(box.roots, "swap", { "a.txt": "a\n" });
    const id = approve(app, preview(app, path)).id;
    halts.set(id, "git_initialized");
    await halted(app, id, "git_initialized");
    await app.close();
    const moved = join(box.roots, "swap-moved"),
      decoy = folder(box.roots, "decoy", { "d.txt": "d\n" });
    execFileSync("mv", [path, moved]);
    symlinkSync(decoy, path);
    app = await service(box);
    for (const action of ["resume", "rollback"]) {
      app.request({ op: "local-folder-recover", job: id, action });
      const job = await settled(app, id, [
        "recovery_required",
        "succeeded",
        "rolled_back",
      ]);
      assert.equal(job.state, "recovery_required", action);
    }
    assert.deepEqual(readdirSync(decoy), ["d.txt"]);
    assert.equal(
      existsSync(join(moved, ".git")),
      true,
      "the moved original is left for the operator",
    );
    assert.equal(
      app.request({ op: "projects" }).some((p) => p.repo === path),
      false,
    );
  } finally {
    await app.close();
    box.cleanup();
  }
});

test("cancellation is owner-bound and rolls back; admission conflicts in both directions", async () => {
  const box = sandbox("lf-cancel-");
  const reached = gate(),
    release = gate();
  let hold = true;
  const app = await service(box, {
    localFolderInterrupt: async (phase) => {
      if (hold && phase === "handover_created") {
        reached.open();
        await release.opened;
      }
      return false;
    },
  });
  try {
    const existing = app.request({
      op: "project-create",
      name: "Other",
      requestId: "11111111-1111-4111-8111-111111111111",
    });
    const path = folder(box.roots, "cancel-me", { "a.txt": "a\n" });
    const id = approve(app, preview(app, path)).id;
    await reached.opened;
    assert.equal(jobOf(app, id).canCancel, true);
    // Admission while the import owns the slot.
    const second = folder(box.roots, "second", { "b.txt": "b\n" });
    throwsFixed(() => approve(app, preview(app, second)), localFolderJobErrors.busy);
    for (const op of [
      { op: "project-delete", id: existing.id, scope: "agentd", confirmName: "Other" },
      { op: "project-purge", id: existing.id },
    ])
      throwsFixed(() => app.request(op), "Wait for the local folder import to finish.");
    assert.throws(() =>
      app.request({
        op: "repository-start",
        kind: "clone",
        url: "https://github.com/example/repo",
        name: "R",
      }),
    );
    throwsFixed(
      () => app.request({ op: "local-folder-job-cancel", job: id, owner: stranger }),
      localFolderJobErrors.notFound,
    );
    app.request({ op: "local-folder-job-cancel", job: id, owner });
    release.open();
    const job = await settled(app, id, ["cancelled"]);
    assert.equal(job.error, localFolderJobErrors.cancelled);
    assert.deepEqual(readdirSync(path), ["a.txt"]);
    assert.match(
      JSON.stringify(app.request({ op: "audit" })),
      /"outcome":"cancelled"|outcome\\":\\"cancelled/,
    );
    hold = false;

    // Approved task work (queued or running) blocks a new import.
    const task = app.request({
      op: "create",
      adapter: "claude",
      prompt: "x",
      project: existing.id,
    });
    app.request({ op: "approve", id: task.id });
    await waitFor(
      () =>
        ["queued", "running"].includes(
          app.request({ op: "show", id: task.id }).task.status,
        ),
      { what: "approved task" },
    );
    throwsFixed(() => approve(app, preview(app, second)), localFolderJobErrors.busy);
    app.request({ op: "cancel", id: task.id });
  } finally {
    release.open();
    await app.close();
    box.cleanup();
  }
});

test("browser errors from local-folder refusals stay fixed and path-free", async () => {
  const box = sandbox("lf-errors-");
  const app = await service(box);
  try {
    for (const value of [
      ...Object.values(localFolderErrors),
      ...Object.values(localFolderJobErrors),
    ])
      assert.equal(publicError(Error(value)), value);
    for (const path of [
      "/etc",
      join(box.base, "state"),
      join(box.roots, "missing"),
      "relative",
      "/" + "x".repeat(5000),
    ]) {
      let failure;
      try {
        preview(app, path);
      } catch (error) {
        failure = error;
      }
      assert.ok(failure, `preview of ${path.slice(0, 40)} must be refused`);
      const text = publicError(failure);
      assert.ok(Object.values(localFolderErrors).includes(text), text);
      assert.equal(text.includes(box.base), false);
    }
    assert.throws(
      () =>
        app.request({
          op: "local-folder-preview",
          owner: "short",
          name: "x",
          path: box.roots,
        }),
      /Browser owner/,
    );
    const refusals = JSON.stringify(
      app.request({ op: "audit" }).filter((a) => a.action === "local-folder-preview"),
    );
    assert.match(refusals, /refused/);
    assert.equal(refusals.includes(box.base), false);
  } finally {
    await app.close();
    box.cleanup();
  }
});

test("phone gateway requires the access key for approval and recovery but not for reads or cancel", async () => {
  const root = mkdtempSync(join(tmpdir(), "lf-gateway-"));
  const sock = join(root, "control.sock");
  const seen = [];
  const bridge = createServer((s) => {
    s.on("data", (b) => {
      const input = JSON.parse(b.toString());
      seen.push(input);
      const result =
        input.op === "local-folder-roots"
          ? { roots: [{ label: "allowed", path: "/srv/projects" }] }
          : input.op === "local-folder-jobs"
            ? { jobs: [] }
            : { ok: true, op: input.op };
      s.end(JSON.stringify({ ok: true, result }) + "\n");
    });
  });
  let web;
  try {
    execFileSync(
      "openssl",
      [
        "req",
        "-x509",
        "-newkey",
        "rsa:2048",
        "-nodes",
        "-keyout",
        join(root, "key"),
        "-out",
        join(root, "cert"),
        "-days",
        "1",
        "-subj",
        "/CN=localhost",
      ],
      { stdio: "ignore" },
    );
    bridge.listen(sock);
    await once(bridge, "listening");
    web = mobile({
      key: join(root, "key"),
      cert: join(root, "cert"),
      accessHash: createHash("sha256").update("test-access").digest("hex"),
      origin: "https://localhost",
      host: "127.0.0.1",
      port: 0,
      socket: sock,
      publicDir: join(root, "public"),
    });
    await once(web, "listening");
    const req = (path, data, cookie) =>
      new Promise((resolve, reject) => {
        const r = httpsRequest(
          {
            hostname: "127.0.0.1",
            port: web.address().port,
            path,
            method: data ? "POST" : "GET",
            rejectUnauthorized: false,
            headers: {
              ...(data
                ? { "Content-Type": "application/json", Origin: "https://localhost" }
                : {}),
              ...(cookie ? { Cookie: cookie } : {}),
            },
          },
          (res) => {
            let body = "";
            res.on("data", (x) => (body += x));
            res.on("end", () =>
              resolve({
                status: res.statusCode,
                headers: res.headers,
                body: JSON.parse(body || "null"),
              }),
            );
          },
        );
        r.on("error", reject);
        r.end(data ? JSON.stringify(data) : undefined);
      });
    const session = (await req("/api/login", { key: "test-access" })).headers[
      "set-cookie"
    ][0];
    const read = await req("/api/local-folder", null, session);
    assert.deepEqual(read.body, {
      roots: [{ label: "allowed", path: "/srv/projects" }],
      jobs: [],
    });
    const fingerprint = "c".repeat(64),
      job = "00000000-0000-4000-8000-000000000000";
    const denied = await req(
      "/api/local-folder",
      { action: "approve", fingerprint, currentKey: "wrong" },
      session,
    );
    assert.equal(denied.status, 400);
    assert.equal(denied.body.error, "Current access key did not match.");
    const deniedRecovery = await req(
      "/api/local-folder",
      { action: "recover", job, recovery: "rollback" },
      session,
    );
    assert.equal(deniedRecovery.status, 400);
    assert.equal(
      seen.some(
        (x) => x.op === "local-folder-approve" || x.op === "local-folder-recover",
      ),
      false,
    );
    const approved = await req(
      "/api/local-folder",
      { action: "approve", fingerprint, currentKey: "test-access" },
      session,
    );
    assert.equal(approved.status, 200);
    const recovered = await req(
      "/api/local-folder",
      { action: "recover", job, recovery: "rollback", currentKey: "test-access" },
      session,
    );
    assert.equal(recovered.status, 200);
    await req("/api/local-folder", { action: "cancelJob", job }, session);
    const approval = seen.find((x) => x.op === "local-folder-approve");
    assert.match(approval.owner, /^[a-f0-9]{64}$/);
    assert.equal(approval.fingerprint, fingerprint);
    assert.equal("currentKey" in approval, false);
    assert.deepEqual(
      (({ op, job: j, action }) => ({ op, job: j, action }))(
        seen.find((x) => x.op === "local-folder-recover"),
      ),
      { op: "local-folder-recover", job, action: "rollback" },
    );
    assert.equal(seen.find((x) => x.op === "local-folder-job-cancel").job, job);
  } finally {
    web?.close();
    bridge.close();
    rmSync(root, { recursive: true, force: true });
  }
});
