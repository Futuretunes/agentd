import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  existsSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import {
  removeDependencyStage,
  publishDependencies,
} from "../src/dependency-recovery.ts";
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "dep-recovery-")),
    db = new DatabaseSync(":memory:");
  db.exec(
    "CREATE TABLE projects(id TEXT PRIMARY KEY,check_dependencies TEXT,check_lock TEXT,check_manifest TEXT);CREATE TABLE dependency_jobs(id TEXT,project TEXT,state TEXT,fingerprint TEXT,updated TEXT)",
  );
  return { root, db };
}
test("cleanup preserves referenced, aliased, linked and uncertain stages but removes an unreferenced failed stage", () => {
  const { root, db } = fixture();
  const id = randomUUID(),
    stage = join(root, "dependencies", id),
    modules = join(stage, "node_modules");
  mkdirSync(modules, { recursive: true });
  writeFileSync(join(modules, "marker"), "keep");
  try {
    db.prepare("INSERT INTO projects VALUES(?,?,NULL,NULL)").run("p", modules);
    assert.equal(removeDependencyStage(db, root, id), false);
    const alias = join(root, "alias");
    symlinkSync(modules, alias);
    db.prepare("UPDATE projects SET check_dependencies=?").run(alias);
    assert.equal(removeDependencyStage(db, root, id), false);
    db.prepare("UPDATE projects SET check_dependencies=?").run(join(root, "missing"));
    assert.equal(removeDependencyStage(db, root, id), false);
    db.exec("DELETE FROM projects");
    const linked = randomUUID();
    symlinkSync(stage, join(root, "dependencies", linked));
    assert.equal(removeDependencyStage(db, root, linked), false);
    assert.equal(existsSync(modules), true);
    assert.equal(removeDependencyStage(db, root, "../outside"), false);
    assert.equal(removeDependencyStage(db, root, id), true);
    assert.equal(existsSync(stage), false);
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("publication refuses stale job identity and leaves project metadata unchanged", () => {
  const { root, db } = fixture();
  try {
    db.exec(
      "INSERT INTO projects VALUES('p','old','old-lock','old-manifest');INSERT INTO dependency_jobs VALUES('job','p','cancelled','new',NULL)",
    );
    assert.throws(
      () =>
        publishDependencies(db, {
          project: "p",
          job: "job",
          path: "new-path",
          lock: "new-lock",
          manifest: "new",
        }),
      /changed/,
    );
    assert.equal(
      db.prepare("SELECT check_dependencies FROM projects").get().check_dependencies,
      "old",
    );
    assert.equal(db.isTransaction, false);
    db.exec("UPDATE dependency_jobs SET state='running'");
    publishDependencies(db, {
      project: "p",
      job: "job",
      path: "new-path",
      lock: "new-lock",
      manifest: "new",
    });
    assert.equal(
      db.prepare("SELECT state FROM dependency_jobs").get().state,
      "succeeded",
    );
    assert.equal(
      db.prepare("SELECT check_dependencies FROM projects").get().check_dependencies,
      "new-path",
    );
  } finally {
    db.close();
    rmSync(root, { recursive: true, force: true });
  }
});
