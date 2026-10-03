import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { createServer as createHttpServer, request as httpRequest } from "node:http";
import { request } from "node:https";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { failResponse, mobile } from "../src/mobile.ts";

test("a failure after headers terminates the response instead of sending a second status", async () => {
  let secondStatus = false;
  const logged = [];
  const originalError = console.error;
  console.error = (...args) => logged.push(args.join(" "));
  const server = createHttpServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("partial");
    failResponse(
      res,
      () => {
        secondStatus = true;
      },
      Error("/private/host/path secret-fixture"),
    );
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const outcome = await new Promise((resolve) => {
      const r = httpRequest(
        { host: "127.0.0.1", port: server.address().port, path: "/" },
        (res) => {
          res.on("data", () => {});
          res.on("error", () => resolve("terminated"));
          res.on("aborted", () => resolve("terminated"));
          res.on("end", () => resolve(res.complete ? "complete" : "terminated"));
        },
      );
      r.on("error", () => resolve("terminated"));
      r.end();
    });
    assert.equal(outcome, "terminated");
    assert.equal(secondStatus, false);
    assert.deepEqual(logged, ["agentd-mobile: response failed after headers were sent"]);
  } finally {
    console.error = originalError;
    server.close();
  }
});

test("static, image and output failures settle with one bounded error response", async () => {
  const root = mkdtempSync(join(tmpdir(), "mobile-response-"));
  const sock = join(root, "control.sock");
  const emptyPublic = join(root, "public");
  mkdirSync(emptyPublic);
  const bridge = createServer((s) => {
    s.on("data", (b) => {
      const input = JSON.parse(b.toString());
      const result =
        input.op === "attachment-read"
          ? { ext: ".png", data: 42 }
          : input.op === "task-output"
            ? { truncated: false }
            : [];
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
      publicDir: emptyPublic,
    });
    await once(web, "listening");
    const req = (path, data, cookie) =>
      new Promise((resolve, reject) => {
        const r = request(
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
                complete: res.complete,
                body,
              }),
            );
          },
        );
        r.on("error", reject);
        r.end(data ? JSON.stringify(data) : undefined);
      });
    const asset = await req("/app.js");
    assert.equal(asset.status, 400);
    assert.equal(asset.complete, true);
    assert.equal(asset.body.includes(emptyPublic), false);
    const login = await req("/api/login", { key: "test-access" });
    assert.equal(login.status, 200);
    const session = login.headers["set-cookie"][0];
    for (const path of [
      "/api/images/00000000-0000-0000-0000-000000000000",
      "/api/tasks/00000000-0000-0000-0000-000000000000/output",
    ]) {
      const failed = await req(path, null, session);
      assert.equal(failed.status, 400, path);
      assert.equal(failed.complete, true, path);
      assert.ok(JSON.parse(failed.body).error, path);
    }
  } finally {
    web?.close();
    bridge.close();
    rmSync(root, { recursive: true, force: true });
  }
});
