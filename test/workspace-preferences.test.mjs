import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { runner } from "../src/runner.ts";
import {
  normalizeWorkspacePreferences,
  purgeAtFromPreferences,
} from "../src/workspace-preferences.ts";

function repo(root, name) {
  const path = join(root, name);
  mkdirSync(path);
  const git = (...args) => execFileSync("git", ["-C", path, ...args], { stdio: "pipe" });
  git("init", "-b", "main");
  writeFileSync(join(path, "README.md"), name);
  git("add", ".");
  git(
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "fixture",
  );
  return path;
}

test("workspace preferences normalize and persist through runner", async () => {
  assert.equal(normalizeWorkspacePreferences({ theme: "dark" }).theme, "dark");
  assert.equal(normalizeWorkspacePreferences({ theme: "neon" }).theme, "system");
  assert.equal(normalizeWorkspacePreferences({ deleteGraceDays: 0 }).deleteGraceDays, 7);
  const root = mkdtempSync(join(tmpdir(), "prefs-"));
  const app = runner({
    stateDir: join(root, "state"),
    repo: repo(root, "original"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    command: () => [process.execPath, ["-e", 'console.log("ok")']],
  });
  await once(app.server, "listening");
  try {
    const defaults = app.request({ op: "workspace-preferences" });
    assert.equal(defaults.deleteTiming, "immediate");
    const saved = app.request({
      op: "workspace-preferences-save",
      values: {
        theme: "dark",
        density: "compact",
        defaultAdapter: "codex",
        defaultMode: "edit",
        defaultModel: "provider",
        defaultEffort: "high",
        deleteTiming: "grace",
        deleteGraceDays: 3,
        drawerAutoClose: false,
        noticeInfoMs: 4000,
        noticeErrorMs: 9000,
      },
    });
    assert.equal(saved.theme, "dark");
    assert.equal(saved.deleteTiming, "grace");
    assert.equal(saved.deleteGraceDays, 3);
    assert.equal(app.request({ op: "workspace-preferences" }).density, "compact");
    const when = purgeAtFromPreferences(saved, new Date("2026-01-01T00:00:00.000Z"));
    assert.equal(when, "2026-01-04T00:00:00.000Z");
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test("project delete A immediate purge keeps checkout; grace can cancel; busy refused", async () => {
  const root = mkdtempSync(join(tmpdir(), "delete-"));
  const projectsDir = join(root, "projects");
  mkdirSync(projectsDir, { recursive: true });
  const app = runner({
    stateDir: join(root, "state"),
    repo: repo(root, "original"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    projectsDir,
    command: () => [process.execPath, ["-e", 'console.log("ok")']],
  });
  await once(app.server, "listening");
  try {
    const p = app.request({ op: "project-create", name: "Delete me" });
    assert.ok(existsSync(p.repo));
    const pending = app.request({
      op: "create",
      project: p.id,
      adapter: "claude",
      prompt: "busy",
    });
    assert.throws(
      () =>
        app.request({
          op: "project-delete",
          id: p.id,
          scope: "agentd",
          confirmName: "Delete me",
        }),
      /pending/,
    );
    app.request({ op: "cancel", id: pending.id });
    app.request({
      op: "workspace-preferences-save",
      values: { deleteTiming: "grace", deleteGraceDays: 5 },
    });
    const scheduled = app.request({
      op: "project-delete",
      id: p.id,
      scope: "agentd",
      confirmName: "Delete me",
    });
    assert.equal(scheduled.purged, false);
    assert.ok(!app.request({ op: "projects" }).some((x) => x.id === p.id));
    assert.ok(
      app.request({ op: "archived-projects" }).some((x) => x.id === p.id && x.deleted_at),
    );
    assert.ok(existsSync(p.repo));
    app.request({ op: "project-delete-cancel", id: p.id });
    assert.ok(app.request({ op: "projects" }).some((x) => x.id === p.id));

    app.request({
      op: "workspace-preferences-save",
      values: { deleteTiming: "immediate" },
    });
    const purged = app.request({
      op: "project-delete",
      id: p.id,
      scope: "agentd",
      confirmName: "Delete me",
    });
    assert.equal(purged.purged, true);
    assert.ok(!app.request({ op: "projects" }).some((x) => x.id === p.id));
    assert.ok(existsSync(p.repo));
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});

test("project delete B removes managed checkout only", async () => {
  const root = mkdtempSync(join(tmpdir(), "delete-b-"));
  const projectsDir = join(root, "projects");
  mkdirSync(projectsDir, { recursive: true });
  const app = runner({
    stateDir: join(root, "state"),
    repo: repo(root, "original"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    projectsDir,
    command: () => [process.execPath, ["-e", 'console.log("ok")']],
  });
  await once(app.server, "listening");
  try {
    const managed = app.request({ op: "project-create", name: "Managed" });
    const linked = app.request({
      op: "project-register",
      name: "Linked",
      repo: repo(root, "external"),
    });
    assert.throws(
      () =>
        app.request({
          op: "project-delete",
          id: linked.id,
          scope: "agentd_and_checkout",
          confirmName: "Linked",
        }),
      /outside AgentD-managed/,
    );
    app.request({
      op: "workspace-preferences-save",
      values: { deleteTiming: "immediate" },
    });
    const result = app.request({
      op: "project-delete",
      id: managed.id,
      scope: "agentd_and_checkout",
      confirmName: "Managed",
    });
    assert.equal(result.purged, true);
    assert.ok(!existsSync(managed.repo));
    assert.ok(existsSync(linked.repo));
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
