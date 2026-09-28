import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { DatabaseSync } from "node:sqlite";
import { runner } from "../src/runner.ts";
import { creationRequests } from "../src/creation-requests.ts";
import { initializeTaskDatabase } from "../src/task-database.ts";
import { stageCreation, completeCreation } from "../public/request-id.js";
test("creation receipts survive lost responses and restart without duplicate tasks, conversations or projects", async () => {
  const root = mkdtempSync(join(tmpdir(), "create-request-")),
    repo = join(root, "repo");
  mkdirSync(repo);
  execFileSync("/usr/bin/git", ["-C", repo, "init", "-b", "main"], {
    stdio: "pipe",
  });
  execFileSync(
    "/usr/bin/git",
    [
      "-C",
      repo,
      "-c",
      "user.name=test",
      "-c",
      "user.email=test@localhost",
      "commit",
      "--allow-empty",
      "-m",
      "base",
    ],
    { stdio: "pipe" },
  );
  const config = {
    repo,
    stateDir: join(root, "state"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    command: () => [process.execPath, ["-e", ""]],
    accountStatus: () => ({ state: "signed_out" }),
  };
  let app = runner(config);
  await once(app.server, "listening");
  try {
    const input = {
      op: "create",
      requestId: randomUUID(),
      adapter: "claude",
      prompt: "private creation prompt",
      overrides: { context: "none", timeoutSeconds: 30 },
    };
    const first = app.request(input);
    assert.equal(
      app.request({
        ...input,
        overrides: { timeoutSeconds: 30, context: "none" },
      }).id,
      first.id,
    );
    assert.equal(app.request({ op: "list" }).length, 1);
    assert.equal(app.request({ op: "conversations", project: "default" }).length, 1);
    assert.throws(() => app.request({ ...input, prompt: "different" }), /different work/);
    const projectInput = {
        op: "project-create",
        requestId: randomUUID(),
        name: "private project name",
      },
      project = app.request(projectInput);
    assert.equal(app.request(projectInput).id, project.id);
    await app.close();
    app = runner(config);
    await once(app.server, "listening");
    assert.equal(app.request(input).id, first.id);
    assert.equal(app.request(projectInput).id, project.id);
    assert.equal(app.request({ op: "projects" }).length, 2);
    const invalid = {
      op: "create",
      requestId: randomUUID(),
      adapter: "claude",
      prompt: "",
    };
    assert.throws(() => app.request(invalid));
    const repaired = app.request({ ...invalid, prompt: "valid after failure" });
    assert.ok(repaired.id);
    const db = new DatabaseSync(join(config.stateDir, "tasks.sqlite"));
    try {
      assert.equal(db.prepare("SELECT count(*) AS n FROM creation_requests").get().n, 3);
      const rows = JSON.stringify(db.prepare("SELECT * FROM creation_requests").all());
      assert.ok(!rows.includes(input.prompt));
      assert.ok(!rows.includes(projectInput.name));
    } finally {
      db.close();
    }
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("receipt uniqueness, scope and rollback are enforced by the database transaction", () => {
  const db = new DatabaseSync(":memory:");
  try {
    initializeTaskDatabase(db, "/fixture");
    const requests = creationRequests(db),
      input = {
        op: "create",
        requestId: randomUUID(),
        adapter: "claude",
        prompt: "fixture",
      },
      r = requests.inspect(input, "browser:a");
    assert.throws(() => requests.save(r, "x"), /transaction/);
    db.exec("BEGIN");
    requests.save(r, "x");
    db.exec("ROLLBACK");
    assert.equal(requests.inspect(input, "browser:a").resultId, null);
    db.exec("BEGIN");
    requests.save(r, "x");
    assert.throws(() => requests.save(r, "other"), /UNIQUE/);
    db.exec("COMMIT");
    assert.equal(requests.inspect(input, "browser:a").resultId, "x");
    assert.equal(requests.inspect(input, "browser:b").resultId, null);
    assert.throws(
      () => requests.inspect({ ...input, mode: "edit" }, "browser:a"),
      /different work/,
    );
  } finally {
    db.close();
  }
});
test("browser staging reuses uncertain requests across reload, requires consent for different work and refuses unsaved sends", () => {
  const data = new Map(),
    storage = {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, value),
      removeItem: (key) => data.delete(key),
    },
    key = "draft:request",
    payload = { op: "create", prompt: "hello" },
    id = randomUUID();
  const first = stageCreation(
    storage,
    key,
    payload,
    () => false,
    () => id,
  );
  assert.equal(first.requestId, id);
  const reloaded = stageCreation(storage, key, {
    prompt: "hello",
    op: "create",
  });
  assert.equal(reloaded.requestId, id);
  assert.throws(
    () => stageCreation(storage, key, { ...payload, prompt: "changed" }),
    /earlier send/,
  );
  const other = stageCreation(
    storage,
    key,
    { ...payload, prompt: "changed" },
    () => true,
  );
  assert.notEqual(other.requestId, id);
  completeCreation(storage, key, id);
  assert.ok(data.has(key));
  completeCreation(storage, key, other.requestId);
  assert.equal(data.has(key), false);
  assert.throws(
    () =>
      stageCreation(
        {
          ...storage,
          setItem() {
            throw Error("quota");
          },
        },
        key,
        payload,
      ),
    /cannot save/,
  );
});
