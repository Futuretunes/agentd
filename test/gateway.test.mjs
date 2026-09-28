import { runner } from "../src/runner.ts";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createConnection } from "node:net";
import {
  mkdtempSync,
  realpathSync,
  mkdirSync,
  rmSync,
  writeFileSync,
  symlinkSync,
  statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gatewayRequest, gatewaySocket } from "../src/gateway-protocol.ts";
import { attachmentStore } from "../src/attachment-store.ts";
const owner = "a".repeat(64);
test("gateway authority rejects admin operations, extra path fields and missing browser owners", () => {
  for (const op of [
    "audit",
    "project-register",
    "project-checks",
    "shell",
    "__proto__",
    "constructor",
    "unknown",
  ])
    assert.throws(() => gatewayRequest({ op }));
  for (const value of [
    null,
    [],
    4,
    { op: "create", repo: "/tmp" },
    { op: "project-create", name: "X", command: "x" },
    { op: "approve", id: "x", fingerprint: "f", force: true },
    { op: "account-start", owner: "spoofed" },
  ])
    assert.throws(() => gatewayRequest(value));
  for (const op of ["operations", "projects", "capabilities"])
    assert.equal(gatewayRequest({ op }).op, op);
  assert.equal(
    gatewayRequest({
      op: "account-start",
      owner,
      adapter: "claude",
      action: "login",
    }).owner,
    owner,
  );
  assert.equal(
    gatewayRequest({ op: "conversation-rename", id: "x", name: "New" }).name,
    "New",
  );
});
const call = (path, data) =>
  new Promise((resolve, reject) => {
    const socket = createConnection(path);
    let text = "";
    socket.on("error", reject);
    socket.on("connect", () => socket.end(data));
    socket.on("data", (chunk) => (text += chunk));
    socket.on("end", () => resolve(text ? JSON.parse(text) : null));
  });
test("raw gateway socket enforces authority without trusting the HTTPS process", async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "gateway-")));
  let gateway;
  const calls = [];
  try {
    gateway = gatewaySocket(
      { path: join(root, "gateway.sock"), gid: process.getgid() },
      (value) => {
        calls.push(value);
        return { accepted: true };
      },
    );
    await once(gateway.server, "listening");
    assert.equal(statSync(root).mode & 0o777, 0o750);
    assert.equal(statSync(join(root, "gateway.sock")).mode & 0o777, 0o660);
    assert.equal(
      (await call(join(root, "gateway.sock"), '{"op":"projects"}\n')).ok,
      true,
    );
    for (const value of [
      { op: "project-register", repo: "/tmp" },
      { op: "project-checks", dependencies: "/tmp" },
      { op: "audit" },
      { op: "create", prompt: "x", home: "/private" },
    ])
      assert.equal(
        (await call(join(root, "gateway.sock"), JSON.stringify(value) + "\n"))
          .ok,
        false,
      );
    assert.equal(
      (
        await call(
          join(root, "gateway.sock"),
          '{"op":"projects"}\n{"op":"projects"}\n',
        )
      ).ok,
      false,
    );
    assert.equal(calls.length, 1);
    assert.equal(
      (
        await call(
          join(root, "gateway.sock"),
          JSON.stringify({ op: "create", prompt: "x".repeat(81000) }) + "\n",
        )
      ).ok,
      false,
    );
  } finally {
    await gateway?.close();
    rmSync(root, { recursive: true, force: true });
  }
});
test("runner-owned image storage rejects traversal, forged metadata and symlink reads", () => {
  const root = mkdtempSync(join(tmpdir(), "images-"));
  try {
    const images = attachmentStore(root),
      data =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
    const meta = images.upload({ data, name: "photo" });
    assert.equal(images.read(meta.id).data, data);
    assert.throws(() => images.read("../private"));
    assert.throws(() => images.upload({ data: "not base64" }));
    writeFileSync(
      join(root, meta.id + ".json"),
      JSON.stringify({ ...meta, ext: "/../../private" }),
    );
    assert.throws(() => images.read(meta.id));
    rmSync(join(root, meta.id + ".json"));
    symlinkSync("/etc/passwd", join(root, meta.id + ".json"));
    assert.throws(() => images.read(meta.id));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("separate runner socket preserves image flow and approvals while admin socket stays private", async () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), "bridge-")));
  let app;
  try {
    const repo = join(root, "repo"),
      gatewayDir = join(root, "web");
    mkdirSync(repo);
    mkdirSync(gatewayDir);
    execFileSync("git", ["-C", repo, "init", "-b", "main"], { stdio: "pipe" });
    execFileSync(
      "git",
      [
        "-C",
        repo,
        "-c",
        "user.name=fixture",
        "-c",
        "user.email=fixture@example.invalid",
        "commit",
        "--allow-empty",
        "-m",
        "Fixture",
      ],
      { stdio: "pipe" },
    );
    const path = join(gatewayDir, "gateway.sock");
    app = runner({
      repo,
      stateDir: join(root, "state"),
      worktrees: join(root, "trees"),
      logs: join(root, "logs"),
      gateway: { path, gid: process.getgid() },
      accountStatus: () => ({
        state: "signed_out",
        method: null,
        checkedAt: null,
        message: "Fixture",
      }),
      command: () => [process.execPath, ["-e", "console.log('fixture')"]],
    });
    await Promise.all([
      once(app.server, "listening"),
      once(app.gateway.server, "listening"),
    ]);
    const request = async (input) => call(path, JSON.stringify(input) + "\n");
    const image = await request({
      op: "attachment-upload",
      name: "test",
      data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
    });
    assert.equal(image.ok, true);
    assert.equal(
      (await request({ op: "attachment-read", id: image.result.id })).ok,
      true,
    );
    const task = await request({
      op: "create",
      adapter: "claude",
      prompt: "fixture",
      attachments: [image.result.id],
    });
    assert.equal(task.result.status, "waiting_for_approval");
    assert.equal(
      (
        await request({
          op: "approve",
          id: task.result.id,
          fingerprint: "wrong",
        })
      ).ok,
      false,
    );
    assert.equal(
      (await request({ op: "approve", id: task.result.id })).ok,
      false,
    );
    assert.equal((await request({ op: "audit" })).ok, false);
    assert.equal(
      (await call(join(root, "state/control.sock"), '{"op":"audit"}\n')).ok,
      true,
    );
    assert.equal(
      (await request({ op: "cancel", id: task.result.id })).result.status,
      "cancelled",
    );
  } finally {
    await app?.close();
    rmSync(root, { recursive: true, force: true });
  }
});
