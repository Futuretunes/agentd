import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  initializeTaskDatabase,
  taskSchemaVersion,
  TASK_SCHEMA_VERSION,
} from "../src/task-database.ts";
import { runner } from "../src/runner.ts";

function legacy(db) {
  db.exec(`CREATE TABLE tasks(id TEXT PRIMARY KEY,adapter TEXT,prompt TEXT,revision TEXT,status TEXT,created TEXT,updated TEXT,worktree TEXT,log TEXT,error TEXT,parent TEXT);
  INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated) VALUES('a','claude','first','abc','running','1','1');
  INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,parent) VALUES('b','claude','follow','abc','succeeded','2','2','a');`);
}
const dump = (db) => ({
  schema: db.prepare("SELECT * FROM sqlite_master ORDER BY name").all(),
  rows: db.prepare("SELECT * FROM tasks ORDER BY id").all(),
  version: taskSchemaVersion(db),
});

test("historical tasks migrate transactionally and retain conversation ancestry across restarts", () => {
  const db = new DatabaseSync(":memory:");
  try {
    legacy(db);
    initializeTaskDatabase(db, "/fixture/repo");
    assert.equal(taskSchemaVersion(db), TASK_SCHEMA_VERSION);
    assert.deepEqual(
      db
        .prepare("SELECT conversation FROM tasks ORDER BY id")
        .all()
        .map((r) => r.conversation),
      ["a", "a"],
    );
    assert.equal(
      db.prepare("SELECT status FROM tasks WHERE id='a'").get().status,
      "interrupted",
    );
    const before = dump(db);
    initializeTaskDatabase(db, "/fixture/repo");
    assert.deepEqual(dump(db), before);
  } finally {
    db.close();
  }
});

test("ancestry errors roll back schema, data and version; correction can retry", () => {
  const db = new DatabaseSync(":memory:");
  try {
    legacy(db);
    db.exec("UPDATE tasks SET parent='b' WHERE id='a'");
    const before = dump(db);
    assert.throws(
      () => initializeTaskDatabase(db, "/fixture/repo"),
      /ancestry/,
    );
    assert.deepEqual(dump(db), before);
    db.exec("UPDATE tasks SET parent=NULL WHERE id='a'");
    initializeTaskDatabase(db, "/fixture/repo");
    assert.equal(taskSchemaVersion(db), TASK_SCHEMA_VERSION);
  } finally {
    db.close();
  }
});

test("unrecognized schema and recovery errors do not partially migrate legacy databases", () => {
  for (const extra of [
    "CREATE TABLE surprise(id INTEGER)",
    "ALTER TABLE tasks ADD COLUMN checks TEXT; UPDATE tasks SET checks='broken-json'",
  ]) {
    const db = new DatabaseSync(":memory:");
    try {
      legacy(db);
      db.exec(extra);
      const before = dump(db);
      assert.throws(() => initializeTaskDatabase(db, "/fixture/repo"));
      assert.deepEqual(dump(db), before);
    } finally {
      db.close();
    }
  }
});

test("current version does not silently repair missing columns or indexes", () => {
  const db = new DatabaseSync(":memory:");
  try {
    initializeTaskDatabase(db, "/fixture/repo");
    db.exec("DROP INDEX tasks_retry_of");
    const before = dump(db);
    assert.throws(
      () => initializeTaskDatabase(db, "/fixture/repo"),
      /schema index/,
    );
    assert.deepEqual(dump(db), before);
  } finally {
    db.close();
  }
});

test("future schema refuses runner startup before status changes or worker cleanup", () => {
  const root = mkdtempSync(join(tmpdir(), "agentd-schema-"));
  try {
    const state = join(root, "state");
    mkdirSync(state);
    mkdirSync(join(state, "worker-preserve"));
    writeFileSync(join(state, "worker-preserve", "marker"), "keep");
    const file = join(state, "tasks.sqlite");
    const db = new DatabaseSync(file);
    legacy(db);
    db.exec("PRAGMA user_version=999");
    db.close();
    const bytes = readFileSync(file);
    assert.throws(
      () =>
        runner({
          stateDir: state,
          repo: root,
          worktrees: join(root, "trees"),
          logs: join(root, "logs"),
        }),
      /Unsupported task schema version 999/,
    );
    assert.deepEqual(readFileSync(file), bytes);
    assert.equal(
      readFileSync(join(state, "worker-preserve", "marker"), "utf8"),
      "keep",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("version-one receipt migration is atomic with recovery and current receipts are never silently repaired", () => {
  const db = new DatabaseSync(":memory:");
  try {
    legacy(db);
    initializeTaskDatabase(db, "/fixture/repo");
    db.exec(
      "DROP TABLE creation_requests; PRAGMA user_version=1; UPDATE tasks SET status='running',checks='broken-json' WHERE id='a'",
    );
    const before = dump(db);
    assert.throws(() => initializeTaskDatabase(db, "/fixture/repo"));
    assert.deepEqual(dump(db), before);
    assert.equal(
      db
        .prepare(
          "SELECT name FROM sqlite_master WHERE name='creation_requests'",
        )
        .get(),
      undefined,
    );
    db.exec("UPDATE tasks SET checks=NULL WHERE id='a'");
    initializeTaskDatabase(db, "/fixture/repo");
    assert.equal(taskSchemaVersion(db), 2);
    assert.equal(
      db.prepare("SELECT status FROM tasks WHERE id='a'").get().status,
      "interrupted",
    );
    assert.equal(
      db.prepare("SELECT prompt FROM tasks WHERE id='a'").get().prompt,
      "first",
    );
    db.exec("DROP TABLE creation_requests");
    const broken = dump(db);
    assert.throws(
      () => initializeTaskDatabase(db, "/fixture/repo"),
      /receipt schema/,
    );
    assert.deepEqual(dump(db), broken);
  } finally {
    db.close();
  }
});
