import { attachmentStore } from "../src/attachment-store.ts";
import { gatewayRequest } from "../src/gateway-protocol.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { once } from "node:events";
import { createHash, randomUUID } from "node:crypto";
import { request } from "node:https";
import { createServer } from "node:net";
import { mobile } from "../src/mobile.ts";
test("HTTPS auth secure cookies CSRF uploads and private runner bridge", async () => {
  const root = mkdtempSync(join(tmpdir(), "mobile-test-"));
  let web,
    unsafeError = false;
  const calls = [];
  const sock = join(root, "control.sock");
  mkdirSync(join(root, "runner-images"));
  const images = attachmentStore(join(root, "runner-images"));
  const bridge = createServer((s) => {
    s.on("data", (b) => {
      try {
        const input = gatewayRequest(JSON.parse(b.toString()));
        if (unsafeError) throw Error("fatal: /private/server/path secret-fixture");
        calls.push(input);
        s.end(
          JSON.stringify({
            ok: true,
            result:
              input.op === "attachment-upload"
                ? images.upload(input)
                : input.op === "attachment-read"
                  ? images.read(input.id)
                  : input.op === "task-output"
                    ? { text: "fixture output", truncated: false }
                    : input.op === "admin-service-restart-plan"
                      ? {
                          target: input.target,
                          idle: true,
                          label:
                            input.target === "runner" ? "Task runner" : "Phone gateway",
                        }
                      : input.op === "admin-service-restart"
                        ? { restarted: true, target: input.target }
                        : input.op === "admin-updates"
                          ? {
                              format: 1,
                              installed: {
                                version: "0.62.3",
                                revision: "abc",
                                taskSchemaVersion: 2,
                              },
                              configuration: "ok",
                              running: false,
                              job: null,
                              candidates: [
                                {
                                  version: "0.63.0",
                                  revision: "def",
                                  valid: true,
                                  newer: true,
                                },
                                {
                                  version: "0.62.3",
                                  revision: "abc",
                                  valid: true,
                                  newer: false,
                                },
                              ],
                              rollback: {
                                available: true,
                                version: "0.62.2",
                                revision: "old",
                                completedAt: "2026-09-29T12:00:00+00:00",
                                schemaChange: false,
                              },
                            }
                          : [],
          }) + "\n",
        );
      } catch (e) {
        s.end(JSON.stringify({ ok: false, error: e.message }) + "\n");
      }
    });
  });
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
        " -out".trim(),
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
      attachments: join(root, "images"),
      publicDir: new URL("../public", import.meta.url).pathname,
    });
    await once(web, "listening");
    const req = (path, data, cookie, origin = "https://localhost") =>
      new Promise((resolve, reject) => {
        const r = request(
          {
            hostname: "127.0.0.1",
            port: web.address().port,
            path,
            method: data ? "POST" : "GET",
            rejectUnauthorized: false,
            headers: {
              ...(data ? { "Content-Type": "application/json", Origin: origin } : {}),
              ...(cookie ? { Cookie: cookie } : {}),
            },
          },
          (res) => {
            let b = "";
            res.on("data", (x) => (b += x));
            res.on("end", () =>
              resolve({ status: res.statusCode, headers: res.headers, body: b }),
            );
          },
        );
        r.on("error", reject);
        r.end(data ? JSON.stringify(data) : undefined);
      });
    assert.equal((await req("/api/projects")).status, 401);
    assert.equal((await req("/api/tasks")).status, 401);
    assert.equal((await req("/api/login", { key: "wrong" })).status, 401);
    for (const asset of ["/ui.js", "/request-id.js", "/fonts/geist-400.ttf"])
      assert.equal((await req(asset)).status, 200);
    const login = await req("/api/login", { key: "test-access" });
    assert.equal(login.status, 200);
    const cookie = login.headers["set-cookie"][0];
    const expectedOwner = createHash("sha256")
      .update(cookie.split(";")[0].slice(15))
      .digest("hex");
    const diagnostics = await req("/api/diagnostics", null, cookie);
    assert.equal(diagnostics.status, 200);
    assert.equal(calls.at(-1).op, "admin-diagnostics");
    for (const [action, op] of [
      ["start", "review-start"],
      ["status", "review-job"],
      ["file", "review-file"],
      ["acknowledge", "review-file-acknowledge"],
      ["page", "review-file-page"],
      ["acknowledgePage", "review-file-page-acknowledge"],
      ["cancel", "review-cancel"],
    ]) {
      const payload =
        action === "start"
          ? { action, id: "x", owner: "spoofed" }
          : {
              action,
              job: "j",
              owner: "spoofed",
              ...(["file", "acknowledge", "page", "acknowledgePage"].includes(action)
                ? {
                    tree: "a".repeat(40),
                    file: "README.md",
                    ...(action === "acknowledge" ? { fingerprint: "b".repeat(64) } : {}),
                    ...(["page", "acknowledgePage"].includes(action) ? { page: 0 } : {}),
                    ...(action === "acknowledgePage"
                      ? {
                          pages: 2,
                          fileFingerprint: "c".repeat(64),
                          pageFingerprint: "d".repeat(64),
                        }
                      : {}),
                  }
                : {}),
            };
      assert.equal((await req("/api/review-jobs", payload, cookie)).status, 200);
      assert.equal(calls.at(-1).op, op);
      assert.equal(calls.at(-1).owner, expectedOwner);
      assert.equal(
        (await req("/api/review-jobs", payload, cookie, "https://evil.example")).status,
        403,
      );
    }
    for (const [action, op] of [
      ["start", "validation-start"],
      ["status", "validation-job"],
      ["cancel", "validation-cancel"],
    ]) {
      const payload =
        action === "start"
          ? { action, id: "x", tree: "a".repeat(40), owner: "spoofed" }
          : { action, job: "j", owner: "spoofed" };
      assert.equal((await req("/api/validation-jobs", payload, cookie)).status, 200);
      assert.equal(calls.at(-1).op, op);
      assert.equal(calls.at(-1).owner, expectedOwner);
      assert.equal(
        (await req("/api/validation-jobs", payload, cookie, "https://evil.example"))
          .status,
        403,
      );
    }
    for (const [action, op] of [
      ["start", "commit-start"],
      ["status", "commit-job"],
      ["cancel", "commit-cancel"],
    ]) {
      const payload =
        action === "start"
          ? {
              action,
              id: "x",
              tree: "a".repeat(40),
              message: "Approved edit",
              owner: "spoofed",
            }
          : { action, job: "j", owner: "spoofed" };
      assert.equal((await req("/api/commit-jobs", payload, cookie)).status, 200);
      assert.equal(calls.at(-1).op, op);
      assert.equal(calls.at(-1).owner, expectedOwner);
      assert.equal(
        (await req("/api/commit-jobs", payload, cookie, "https://evil.example")).status,
        403,
      );
    }
    for (const [action, op] of [
      ["start", "revision-start"],
      ["status", "revision-job"],
      ["cancel", "revision-cancel"],
    ]) {
      const payload =
        action === "start"
          ? {
              action,
              id: "x",
              tree: "a".repeat(40),
              prompt: "Refine it",
              owner: "spoofed",
            }
          : { action, job: "j", owner: "spoofed" };
      assert.equal((await req("/api/revision-jobs", payload, cookie)).status, 200);
      assert.equal(calls.at(-1).op, op);
      assert.equal(calls.at(-1).owner, expectedOwner);
      assert.equal(
        (await req("/api/revision-jobs", payload, cookie, "https://evil.example")).status,
        403,
      );
    }
    for (const [action, op] of [
      ["start", "restart-start"],
      ["status", "restart-job"],
      ["cancel", "restart-cancel"],
    ]) {
      const payload =
        action === "start"
          ? { action, id: "x", owner: "spoofed" }
          : { action, job: "j", owner: "spoofed" };
      assert.equal((await req("/api/restart-jobs", payload, cookie)).status, 200);
      assert.equal(calls.at(-1).op, op);
      assert.equal(calls.at(-1).owner, expectedOwner);
      assert.equal(
        (await req("/api/restart-jobs", payload, cookie, "https://evil.example")).status,
        403,
      );
    }
    assert.match(cookie, /HttpOnly; Secure; SameSite=Strict/);
    assert.equal((await req("/api/tasks", null, cookie)).status, 200);
    assert.equal(
      (
        await req(
          "/api/action",
          { op: "approve", id: "x" },
          cookie,
          "https://evil.example",
        )
      ).status,
      403,
    );
    assert.equal((await req("/api/action", { op: "shell" }, cookie)).status, 400);
    assert.equal(
      (
        await req(
          "/api/action",
          { op: "project-checks", id: "default", dependencies: "/tmp" },
          cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await req(
          "/api/action",
          { op: "project-register", name: "unsafe", repo: "/tmp" },
          cookie,
        )
      ).status,
      400,
    );
    await req("/api/projects", null, cookie);
    assert.equal(calls.at(-1).op, "projects");
    await req("/api/projects/default/conversations", null, cookie);
    assert.equal(calls.at(-1).project, "default");
    await req(
      "/api/action",
      { op: "project-create", name: "Example", requestId: randomUUID() },
      cookie,
    );
    assert.equal(calls.at(-1).op, "project-create");
    assert.equal((await req("/api/action", { op: "retry", id: "x" })).status, 401);
    assert.equal(
      (await req("/api/action", { op: "retry", id: "x" }, cookie, "https://evil.example"))
        .status,
      403,
    );
    await req("/api/action", { op: "retry", id: "x" }, cookie);
    assert.equal(calls.at(-1).op, "retry");
    const download = await req(
      "/api/tasks/00000000-0000-0000-0000-000000000000/output",
      null,
      cookie,
    );
    assert.equal(download.body, "fixture output");
    assert.match(download.headers["content-disposition"], /^attachment;/);
    assert.equal(download.headers["cache-control"], "no-store");
    for (const path of [
      "/api/history",
      "/api/archived-projects",
      "/api/tasks/00000000-0000-0000-0000-000000000000/output",
    ])
      assert.equal((await req(path)).status, 401);
    await req("/api/history?q=literal%25&filter=archived&before=42", null, cookie);
    assert.deepEqual(calls.at(-1), {
      op: "history",
      query: "literal%",
      filter: "archived",
      before: 42,
    });
    await req(
      "/api/conversations/00000000-0000-0000-0000-000000000000?before=31",
      null,
      cookie,
    );
    assert.equal(calls.at(-1).before, 31);
    for (const op of [
      "project-archive",
      "project-restore",
      "conversation-restore",
      "revise",
    ]) {
      assert.equal(
        (await req("/api/action", { op, id: "x" }, cookie, "https://evil.example"))
          .status,
        403,
      );
      await req("/api/action", { op, id: "x" }, cookie);
      assert.equal(calls.at(-1).op, op);
    }
    for (const path of [
      "/api/storage",
      "/api/github",
      "/api/repositories",
      "/api/check-setup",
      "/api/publishing",
      "/api/feedback",
    ]) {
      assert.equal((await req(path)).status, 401);
      assert.equal(
        (await req(path, { action: "start" }, cookie, "https://evil.example")).status,
        403,
      );
    }
    await req(
      "/api/publishing",
      {
        action: "approve",
        id: "preview",
        fingerprint: "exact",
        owner: "spoofed",
        destination: "https://evil.example",
        command: "push",
        draft: false,
      },
      cookie,
    );
    assert.equal(calls.at(-1).op, "publication-approve");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    assert.equal(calls.at(-1).destination, undefined);
    assert.equal(calls.at(-1).command, undefined);
    assert.equal(calls.at(-1).draft, undefined);
    await req(
      "/api/feedback",
      {
        action: "apply",
        id: "preview",
        fingerprint: "exact",
        keys: ["reviews:1"],
        instruction: "Assess",
        owner: "spoofed",
        tree: "injected",
        repo: "/tmp",
        prompt: "injected",
      },
      cookie,
    );
    assert.equal(calls.at(-1).op, "feedback-apply");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    for (const key of ["tree", "repo", "prompt"])
      assert.equal(calls.at(-1)[key], undefined);
    await req(
      "/api/feedback",
      { action: "cancel", id: "preview", owner: "spoofed", signal: "injected" },
      cookie,
    );
    assert.equal(calls.at(-1).op, "feedback-cancel");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    assert.equal(calls.at(-1).signal, undefined);
    await req("/api/feedback?targets=1&task=fixture", null, cookie);
    assert.equal(calls.at(-1).op, "feedback-targets");
    await req("/api/check-setup?project=default&task=fixture", null, cookie);
    assert.deepEqual(calls.at(-1), {
      op: "check-setup",
      project: "default",
      task: "fixture",
    });
    await req(
      "/api/check-setup",
      {
        action: "prepare",
        project: "default",
        fingerprint: "exact",
        dependencies: "/tmp",
        command: "evil",
      },
      cookie,
    );
    assert.deepEqual(calls.at(-1), {
      op: "check-prepare",
      project: "default",
      fingerprint: "exact",
      owner: expectedOwner,
    });
    await req(
      "/api/github",
      {
        action: "start",
        access: "feedback",
        owner: "spoof",
        profile: "/tmp",
      },
      cookie,
    );
    assert.equal(calls.at(-1).op, "github-start");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    assert.equal(calls.at(-1).access, "feedback");
    assert.equal(calls.at(-1).profile, undefined);
    await req(
      "/api/repositories",
      {
        action: "start",
        kind: "import",
        url: "https://github.com/a/b",
        branch: "main",
        name: "Example",
        repo: "/tmp",
        command: "evil",
      },
      cookie,
    );
    assert.deepEqual(calls.at(-1), {
      op: "repository-start",
      kind: "import",
      url: "https://github.com/a/b",
      branch: "main",
      name: "Example",
      owner: expectedOwner,
    });
    assert.equal((await req("/api/settings")).status, 401);
    assert.equal(
      (await req("/api/settings", { action: "save" }, cookie, "https://evil.example"))
        .status,
      403,
    );
    await req(
      "/api/settings",
      {
        action: "save",
        project: "default",
        agent: "claude",
        scope: "project",
        agentScope: "claude",
        values: { access: "read" },
        owner: "spoofed",
        command: "unsafe",
        home: "/private",
      },
      cookie,
    );
    assert.equal(calls.at(-1).op, "settings-save");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    assert.equal(calls.at(-1).command, undefined);
    assert.equal(calls.at(-1).home, undefined);
    assert.equal(
      (await req("/api/action", { op: "approve", id: "fixture" }, cookie)).status,
      400,
    );
    await req(
      "/api/action",
      { op: "approve", id: "fixture", fingerprint: "a".repeat(64) },
      cookie,
    );
    assert.equal(calls.at(-1).fingerprint, "a".repeat(64));
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    await req(
      "/api/action",
      { op: "project-rename", id: "default", name: "New", owner: "spoofed" },
      cookie,
    );
    assert.notEqual(calls.at(-1).owner, "spoofed");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    await req("/api/storage", { action: "preview", owner: "spoof" }, cookie);
    assert.equal(calls.at(-1).op, "storage-preview");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    await req("/api/operations", null, cookie);
    assert.equal(calls.at(-1).op, "operations");
    assert.equal((await req("/api/account")).status, 401);
    assert.equal(
      (
        await req(
          "/api/account",
          { action: "start", adapter: "claude", operation: "login" },
          cookie,
          "https://evil.example",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await req(
          "/api/action",
          { op: "account-start", owner: "spoofed", adapter: "claude", action: "login" },
          cookie,
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await req(
          "/api/account",
          { action: "start", adapter: "shell", operation: "login" },
          cookie,
        )
      ).status,
      400,
    );
    await req(
      "/api/account",
      { action: "start", adapter: "claude", operation: "login", owner: "spoofed" },
      cookie,
    );
    assert.equal(calls.at(-1).op, "account-start");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    const accountOwner = calls.at(-1).owner;
    await req("/api/account", null, cookie);
    assert.equal(calls.at(-1).owner, accountOwner);
    assert.equal(calls.at(-1).op, "account-session");
    await req(
      "/api/account",
      { action: "code", session: "fixture", code: "one-time-code" },
      cookie,
    );
    assert.equal(calls.at(-1).op, "account-code");
    assert.equal(calls.at(-1).code, "one-time-code");
    const otherLogin = await req("/api/login", { key: "test-access" });
    await req("/api/account", null, otherLogin.headers["set-cookie"][0]);
    assert.notEqual(calls.at(-1).owner, accountOwner);
    const previewResponse = await req(
        "/api/access-key",
        { action: "preview", mode: "generated", currentKey: "test-access" },
        cookie,
      ),
      preview = JSON.parse(previewResponse.body);
    assert.equal(previewResponse.status, 200);
    assert.match(preview.generatedKey, /^[A-Za-z0-9_-]{40,}$/);
    assert.equal(preview.invalidatesOtherSessions, 1);
    const rotation = await req(
      "/api/access-key",
      {
        action: "approve",
        fingerprint: preview.fingerprint,
        currentKey: "test-access",
        newKey: preview.generatedKey,
        saved: true,
      },
      cookie,
    );
    assert.equal(rotation.status, 200);
    assert.equal(calls.at(-1).op, "admin-access-rotate");
    assert.equal(
      calls.at(-1).newHash,
      createHash("sha256").update(preview.generatedKey).digest("hex"),
    );
    assert.equal((await req("/api/tasks", null, cookie)).status, 200);
    assert.equal(
      (await req("/api/tasks", null, otherLogin.headers["set-cookie"][0])).status,
      401,
    );
    assert.equal((await req("/api/login", { key: "test-access" })).status, 401);
    assert.equal((await req("/api/login", { key: preview.generatedKey })).status, 200);
    // Current-key guesses on the rotation form share the sign-in limit (10 per minute).
    for (let guess = 0; guess < 8; guess++)
      assert.notEqual(
        (
          await req(
            "/api/access-key",
            { action: "preview", mode: "generated", currentKey: "wrong-" + guess },
            cookie,
          )
        ).status,
        429,
      );
    assert.equal(
      (
        await req(
          "/api/access-key",
          { action: "preview", mode: "generated", currentKey: "wrong" },
          cookie,
        )
      ).status,
      429,
    );
    // Settings > Updates: fresh key, bound preview, explicit confirmation, validated version.
    const newKey = preview.generatedKey;
    assert.equal(
      JSON.parse((await req("/api/updates", null, cookie)).body).installed.version,
      "0.62.3",
    );
    assert.equal(calls.at(-1).op, "admin-updates");
    const update = (value) => req("/api/updates", value, cookie);
    assert.equal(
      (await update({ action: "preview", version: "0.63.0", currentKey: "wrong" }))
        .status,
      400,
    );
    assert.equal(
      (await update({ action: "preview", version: "0.62.3", currentKey: newKey })).status,
      400,
    );
    const updatePreview = JSON.parse(
      (await update({ action: "preview", version: "0.63.0", currentKey: newKey })).body,
    );
    assert.match(updatePreview.fingerprint, /^[a-f0-9]{64}$/);
    const install = (extra) =>
      update({
        action: "install",
        version: "0.63.0",
        fingerprint: updatePreview.fingerprint,
        currentKey: newKey,
        confirmed: true,
        ...extra,
      });
    assert.equal((await install({ confirmed: false })).status, 400);
    assert.equal((await install({ fingerprint: "0".repeat(64) })).status, 400);
    const started = await install({});
    assert.equal(started.status, 202);
    assert.equal(calls.at(-1).op, "admin-update-start");
    assert.equal(calls.at(-1).version, "0.63.0");
    assert.match(calls.at(-1).owner, /^[a-f0-9]{64}$/);
    assert.equal((await install({})).status, 400);
    // Rollback uses its own preview; an update preview cannot approve it.
    assert.equal(
      (
        await update({
          action: "rollback",
          version: "0.63.0",
          fingerprint: updatePreview.fingerprint,
          currentKey: newKey,
          confirmed: true,
        })
      ).status,
      400,
    );
    const rollbackPreview = JSON.parse(
      (await update({ action: "rollback-preview", currentKey: newKey })).body,
    );
    assert.equal(rollbackPreview.rollback.version, "0.62.2");
    const rollbackRequest = (confirmed) =>
      update({
        action: "rollback",
        version: "0.62.2",
        fingerprint: rollbackPreview.fingerprint,
        currentKey: newKey,
        confirmed,
      });
    // (Unconfirmed approval is covered by the update flow above; the shared
    // limit allows 10 update/rollback requests per minute from one address.)
    const rolled = await rollbackRequest(true);
    assert.equal(rolled.status, 202);
    assert.equal(calls.at(-1).op, "admin-rollback-start");
    assert.equal(calls.at(-1).version, "0.62.2");
    assert.equal(
      (
        await req(
          "/api/upload",
          { name: "bad", data: Buffer.from("not an image at all").toString("base64") },
          cookie,
        )
      ).status,
      400,
    );
    const upload = await req(
      "/api/upload",
      {
        name: "test.png",
        data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=",
      },
      cookie,
    );
    assert.equal(upload.status, 201);
    const img = JSON.parse(upload.body);
    assert.equal((await req("/api/images/" + img.id)).status, 401);
    assert.equal((await req("/api/images/" + img.id, null, cookie)).status, 200);
    assert.equal(existsSync(join(root, "images")), false);
    assert.equal(
      (
        await req(
          "/api/action",
          { op: "project-create", name: "No", repo: "/etc" },
          cookie,
        )
      ).status,
      400,
    );
    unsafeError = true;
    const redacted = await req("/api/projects", null, cookie);
    assert.equal(redacted.status, 400);
    assert.ok(!redacted.body.includes("/private"));
    assert.ok(!redacted.body.includes("secret-fixture"));
    unsafeError = false;
    await req(
      "/api/action",
      {
        op: "create",
        adapter: "codex",
        prompt: "test",
        attachments: [img.id],
        requestId: randomUUID(),
      },
      cookie,
    );
    assert.equal(calls.at(-1).attachments[0], img.id);
    await req("/api/logout", {}, cookie);
    assert.equal((await req("/api/tasks", null, cookie)).status, 401);
  } finally {
    if (web) {
      web.closeAllConnections();
      await new Promise((r) => web.close(r));
    }
    await new Promise((r) => bridge.close(r));
    rmSync(root, { recursive: true, force: true });
  }
});
