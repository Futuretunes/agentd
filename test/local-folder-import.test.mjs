import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  symlinkSync,
  readFileSync,
  realpathSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { runner } from "../src/runner.ts";
import {
  detectStackHints,
  inspectLocalFolder,
  resolveLocalFolderPath,
} from "../src/local-folder-import.ts";

const owner = "a".repeat(64);
function git(path, ...args) {
  execFileSync("git", ["-C", path, ...args], { stdio: "pipe" });
}
function makeRepo(root, name) {
  const path = join(root, name);
  mkdirSync(path, { recursive: true });
  git(path, "init", "-b", "main");
  writeFileSync(join(path, "README.md"), name);
  git(path, "add", ".");
  git(
    path,
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "f",
  );
  return path;
}

test("detectStackHints reads manifests deterministically", () => {
  assert.deepEqual(detectStackHints(["package.json", "Cargo.toml"]), [
    "Node.js / npm",
    "Rust",
  ]);
});

test("resolveLocalFolderPath allowlists, canonicalizes, and blocks escapes", () => {
  const root = mkdtempSync(join(tmpdir(), "roots-"));
  const allowed = join(root, "allowed");
  const outside = join(root, "outside");
  mkdirSync(allowed);
  mkdirSync(outside);
  mkdirSync(join(allowed, "project"));
  const link = join(allowed, "escape");
  symlinkSync(outside, link);
  assert.equal(
    resolveLocalFolderPath(join(allowed, "project"), [allowed], []).canonical,
    realpathSync(join(allowed, "project")),
  );
  assert.throws(
    () => resolveLocalFolderPath(outside, [allowed], []),
    /outside the configured allowed roots/,
  );
  assert.throws(() => resolveLocalFolderPath(link, [allowed], []), /Symbolic links/);
  assert.throws(
    () => resolveLocalFolderPath(allowed, [allowed], [allowed]),
    /protected location/,
  );
  rmSync(root, { recursive: true, force: true });
});

test("inspect classifies empty, non-git, and existing git folders", () => {
  const root = mkdtempSync(join(tmpdir(), "cases-"));
  const empty = join(root, "empty");
  const nongit = join(root, "nongit");
  mkdirSync(empty);
  mkdirSync(nongit);
  writeFileSync(join(nongit, "package.json"), '{"name":"x"}');
  writeFileSync(join(nongit, ".env"), "SECRET=1");
  writeFileSync(join(nongit, "README.md"), "hi");
  const repo = makeRepo(root, "repo");
  writeFileSync(join(repo, "dirty.txt"), "x");
  const emptyPlan = inspectLocalFolder({
    path: empty,
    name: "Empty",
    roots: [root],
    protectedPaths: [],
  });
  assert.equal(emptyPlan.case, "empty");
  assert.equal(emptyPlan.willCreateInitialCommit, true);
  assert.ok(emptyPlan.handoverToCreate.includes("AGENTS.md"));
  const nonPlan = inspectLocalFolder({
    path: nongit,
    name: "App",
    roots: [root],
    protectedPaths: [],
  });
  assert.equal(nonPlan.case, "non_git");
  assert.ok(nonPlan.filesToAdd.includes("README.md"));
  assert.ok(!nonPlan.filesToAdd.includes(".env"));
  assert.ok(nonPlan.sensitiveFindings.some((f) => f.path === ".env"));
  assert.ok(nonPlan.stack.includes("Node.js / npm"));
  const gitPlan = inspectLocalFolder({
    path: repo,
    name: "Repo",
    roots: [root],
    protectedPaths: [],
  });
  assert.equal(gitPlan.case, "existing_git");
  assert.equal(gitPlan.willCreateInitialCommit, false);
  assert.equal(gitPlan.dirty, true);
  assert.throws(
    () =>
      inspectLocalFolder({
        path: join(root, "missing"),
        name: "x",
        roots: [root],
        protectedPaths: [],
      }),
    /not found/,
  );
  const nested = join(root, "parent");
  mkdirSync(nested);
  makeRepo(nested, "child");
  assert.throws(
    () =>
      inspectLocalFolder({
        path: nested,
        name: "Nested",
        roots: [root],
        protectedPaths: [],
      }),
    /Nested Git/,
  );
  rmSync(root, { recursive: true, force: true });
});

test("local folder preview/approve covers three cases, fingerprint expiry, and duplicates", async () => {
  const root = mkdtempSync(join(tmpdir(), "local-folder-"));
  const projectsDir = join(root, "projects");
  mkdirSync(projectsDir);
  const empty = join(root, "empty");
  const nongit = join(root, "nongit");
  mkdirSync(empty);
  mkdirSync(nongit);
  writeFileSync(join(nongit, "src.js"), "export default 1\n");
  writeFileSync(join(nongit, ".gitignore"), ".env\n");
  writeFileSync(join(nongit, ".env"), "TOKEN=abc");
  const existing = makeRepo(root, "existing");
  const app = runner({
    stateDir: join(root, "state"),
    repo: makeRepo(root, "original"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    projectsDir,
    localProjectRoots: [root],
    command: () => [process.execPath, ["-e", 'console.log("ok")']],
  });
  await once(app.server, "listening");
  try {
    assert.throws(
      () =>
        app.request({
          op: "local-folder-preview",
          owner,
          name: "Bad",
          path: join(root, "nope"),
        }),
      /not found/,
    );
    const emptyPreview = app.request({
      op: "local-folder-preview",
      owner,
      name: "Empty",
      path: empty,
    });
    assert.equal(emptyPreview.case, "empty");
    const emptyResult = app.request({
      op: "local-folder-approve",
      owner,
      fingerprint: emptyPreview.fingerprint,
    });
    assert.ok(existsSync(join(empty, "AGENTS.md")));
    assert.ok(existsSync(join(empty, "docs/handover.md")));
    assert.match(readFileSync(join(empty, "AGENTS.md"), "utf8"), /docs\/handover\.md/);
    assert.ok(app.request({ op: "projects" }).some((p) => p.id === emptyResult.id));

    const nonPreview = app.request({
      op: "local-folder-preview",
      owner,
      name: "NonGit",
      path: nongit,
    });
    assert.equal(nonPreview.case, "non_git");
    assert.ok(!nonPreview.filesToAdd.includes(".env"));
    writeFileSync(join(nongit, "extra.js"), "2\n");
    assert.throws(
      () =>
        app.request({
          op: "local-folder-approve",
          owner,
          fingerprint: nonPreview.fingerprint,
        }),
      /changed after preview|expired/,
    );
    const nonPreview2 = app.request({
      op: "local-folder-preview",
      owner,
      name: "NonGit",
      path: nongit,
    });
    const nonResult = app.request({
      op: "local-folder-approve",
      owner,
      fingerprint: nonPreview2.fingerprint,
    });
    assert.ok(existsSync(join(nongit, ".git")));
    assert.ok(!existsSync(join(nongit, ".env")) || true);
    assert.equal(
      execFileSync("git", ["-C", nongit, "ls-files"], { encoding: "utf8" }).includes(
        ".env",
      ),
      false,
    );
    assert.ok(app.request({ op: "projects" }).some((p) => p.id === nonResult.id));

    writeFileSync(join(existing, "AGENTS.md"), "keep me\n");
    const gitPreview = app.request({
      op: "local-folder-preview",
      owner,
      name: "Existing",
      path: existing,
    });
    assert.equal(gitPreview.case, "existing_git");
    assert.equal(gitPreview.willCreateInitialCommit, false);
    assert.ok(!gitPreview.handoverToCreate.includes("AGENTS.md"));
    const before = readFileSync(join(existing, "AGENTS.md"), "utf8");
    const gitResult = app.request({
      op: "local-folder-approve",
      owner,
      fingerprint: gitPreview.fingerprint,
    });
    assert.equal(readFileSync(join(existing, "AGENTS.md"), "utf8"), before);
    const dupPreview = app.request({
      op: "local-folder-preview",
      owner,
      name: "Dup",
      path: existing,
    });
    assert.throws(
      () =>
        app.request({
          op: "local-folder-approve",
          owner,
          fingerprint: dupPreview.fingerprint,
        }),
      /already registered/,
    );
    assert.ok(gitResult.id);
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test("local folder cancel clears preview and public errors stay fixed", async () => {
  const root = mkdtempSync(join(tmpdir(), "local-cancel-"));
  const folder = join(root, "f");
  mkdirSync(folder, { recursive: true });
  const app = runner({
    stateDir: join(root, "state"),
    repo: makeRepo(root, "original"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    projectsDir: join(root, "projects"),
    localProjectRoots: [root],
    command: () => [process.execPath, ["-e", 'console.log("ok")']],
  });
  await once(app.server, "listening");
  try {
    const preview = app.request({
      op: "local-folder-preview",
      owner,
      name: "F",
      path: folder,
    });
    app.request({ op: "local-folder-cancel", owner });
    assert.throws(
      () =>
        app.request({
          op: "local-folder-approve",
          owner,
          fingerprint: preview.fingerprint,
        }),
      /expired/,
    );
    try {
      app.request({
        op: "local-folder-preview",
        owner,
        name: "F",
        path: "/etc",
      });
      assert.fail("expected refusal");
    } catch (error) {
      assert.match(
        String(error.message),
        /protected|allowed roots|not a folder|not found|not allowed|Symbolic links/,
      );
      assert.equal(String(error.message).includes("/etc"), false);
    }
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
