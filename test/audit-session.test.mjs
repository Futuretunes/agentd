import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { createConnection } from "node:net";
import { createHash } from "node:crypto";
import { runner } from "../src/runner.ts";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
test("browser approvals and missing mutation audits bind to a session pseudonym without names, prompts or owner tokens", async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "audit-session-"))),
    repo = join(root, "repo"),
    web = join(root, "web"),
    owner = "a".repeat(64),
    other = "b".repeat(64);
  mkdirSync(repo);
  mkdirSync(web);
  const raw = (args) =>
    execFileSync("/usr/bin/git", ["-C", repo, ...args], { stdio: "pipe" });
  raw(["init", "-b", "main"]);
  raw([
    "-c",
    "user.name=test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "--allow-empty",
    "-m",
    "base",
  ]);
  const path = join(web, "gateway.sock");
  const app = runner({
    repo,
    stateDir: join(root, "state"),
    worktrees: join(root, "trees"),
    logs: join(root, "logs"),
    gateway: { path, gid: process.getgid() },
    editing: true,
    editAdapters: ["claude"],
    accountStatus: () => ({ state: "signed_out" }),
    command: () => [
      process.execPath,
      ["-e", "require('fs').writeFileSync('README.md','fixture')"],
    ],
    isolate: (_tree, _state, command, args) => ({
      command,
      args,
      cleanup() {},
    }),
  });
  await Promise.all([
    once(app.server, "listening"),
    once(app.gateway.server, "listening"),
  ]);
  const call = (input) =>
    new Promise((resolve, reject) => {
      const socket = createConnection(path);
      let output = "";
      socket.on("error", reject);
      socket.on("connect", () => socket.end(JSON.stringify(input) + "\n"));
      socket.on("data", (v) => (output += v));
      socket.on("end", () => resolve(JSON.parse(output)));
    });
  const browser = async (input, actor = owner) => {
    const v = await call({ ...input, owner: actor });
    assert.equal(v.ok, true, v.error);
    return v.result;
  };
  try {
    const project = app.request({
      op: "project-create",
      name: "private original name",
    });
    await browser({
      op: "project-rename",
      id: project.id,
      name: "private renamed project",
    });
    assert.equal(
      (await call({ op: "project-rename", id: project.id, name: "no owner" }))
        .ok,
      false,
    );
    const row = await browser({
      op: "create",
      project: project.id,
      adapter: "claude",
      mode: "edit",
      prompt: "private task instruction",
    });
    await browser(
      {
        op: "conversation-rename",
        id: row.conversation,
        name: "private conversation name",
      },
      other,
    );
    await browser({
      op: "approve",
      id: row.id,
      fingerprint: JSON.parse(row.execution).fingerprint,
    });
    for (
      let i = 0;
      i < 200 &&
      app.request({ op: "show", id: row.id }).task.status !== "succeeded";
      i++
    )
      await sleep(10);
    assert.equal(
      app.request({ op: "show", id: row.id }).task.status,
      "succeeded",
    );
    await browser({ op: "discard", id: row.id });
    const events = app.request({ op: "audit" }),
      actor = (who) => ({
        kind: "browser",
        session: createHash("sha256")
          .update("agentd-audit-session:" + who)
          .digest("hex"),
      });
    for (const action of [
      "project-rename",
      "create-run",
      "approve-run",
      "discard",
    ])
      assert.deepEqual(
        JSON.parse(events.find((e) => e.action === action).detail).actor,
        actor(owner),
      );
    assert.deepEqual(
      JSON.parse(events.find((e) => e.action === "conversation-rename").detail)
        .actor,
      actor(other),
    );
    assert.deepEqual(
      JSON.parse(events.find((e) => e.action === "project-create").detail)
        .actor,
      { kind: "local" },
    );
    const serialized = JSON.stringify(events);
    for (const value of [
      owner,
      other,
      "private task instruction",
      "private original name",
      "private renamed project",
      "private conversation name",
      root,
    ])
      assert.ok(!serialized.includes(value), value);
    const before = events.length;
    const failed = await call({
      op: "project-rename",
      owner,
      id: project.id,
      name: "",
    });
    assert.equal(failed.ok, false);
    assert.equal(app.request({ op: "audit" }).length, before);
  } finally {
    await app.close();
    rmSync(root, { recursive: true, force: true });
  }
});
