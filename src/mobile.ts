import { publicError, browserResult } from "./public-errors.ts";
import { gatewayRequest, gatewayMutations } from "./gateway-protocol.ts";
import { createServer } from "node:https";
import { createConnection } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import type { IncomingMessage } from "node:http";
type Config = {
  key: string;
  cert: string;
  accessHash: string;
  origin: string;
  host: string;
  port: number;
  socket: string;
  attachments?: string;
  publicDir: string;
};
export function mobile(c: Config) {
  const sessions = new Map<string, number>(),
    attempts = new Map<string, { count: number; until: number }>();
  const bridge = (input: unknown) =>
    new Promise<any>((resolve, reject) => {
      const encoded = JSON.stringify(gatewayRequest(input)) + "\n";
      const s = createConnection(c.socket);
      let text = "";
      s.setTimeout(10000, () => s.destroy(new Error("Runner timed out")));
      s.on("connect", () => s.write(encoded));
      s.on("data", (b) => {
        text += b;
        if (
          Buffer.byteLength(text) >
          ((input as any)?.op === "attachment-read" ? 8_000_000 : 4_000_000)
        )
          s.destroy(new Error("Response too large"));
      });
      s.on("error", reject);
      s.on("end", () => {
        try {
          const value = JSON.parse(text);
          if (!value.ok) reject(new Error(value.error));
          else resolve(browserResult(value.result));
        } catch (e) {
          reject(e);
        }
      });
    });
  async function body(req: IncomingMessage) {
    let n = 0;
    const chunks: Buffer[] = [];
    for await (const b of req) {
      n += b.length;
      if (n > 7_500_000) throw new Error("Request too large");
      chunks.push(b);
    }
    return JSON.parse(Buffer.concat(chunks).toString());
  }
  const server = createServer(
    { key: readFileSync(c.key), cert: readFileSync(c.cert) },
    async (req, res) => {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      );
      const send = (status: number, value: unknown) => {
        res.writeHead(status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(value));
      };
      try {
        const path = (req.url ?? "/").split("?")[0];
        if (
          req.method === "GET" &&
          [
            "/",
            "/app.js",
            "/ui.js",
            "/style.css",
            "/fonts/geist-400.ttf",
            "/fonts/geist-500.ttf",
            "/fonts/geist-600.ttf",
          ].includes(path)
        ) {
          const file = path === "/" ? "index.html" : path.slice(1);
          res.writeHead(200, {
            "Content-Type": file.endsWith(".html")
              ? "text/html; charset=utf-8"
              : file.endsWith(".js")
                ? "text/javascript"
                : file.endsWith(".ttf")
                  ? "font/ttf"
                  : "text/css",
          });
          res.end(readFileSync(join(c.publicDir, file)));
          return;
        }
        if (req.method === "POST") {
          if (
            req.headers.origin !== c.origin ||
            req.headers["content-type"] !== "application/json"
          ) {
            send(403, { error: "Invalid request origin or content type" });
            return;
          }
        }
        if (path === "/api/login" && req.method === "POST") {
          const address = req.socket.remoteAddress ?? "unknown",
            now = Date.now();
          for (const [key, value] of attempts)
            if (value.until < now) attempts.delete(key);
          for (const [key, value] of sessions)
            if (value < now) sessions.delete(key);
          const attempt = attempts.get(address) ?? {
            count: 0,
            until: now + 60000,
          };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(address, attempt);
          const input = await body(req);
          const hash = createHash("sha256")
            .update(String(input.key ?? ""))
            .digest();
          const expected = Buffer.from(c.accessHash, "hex");
          if (expected.length !== 32 || !timingSafeEqual(hash, expected)) {
            send(401, { error: "Access key did not match" });
            return;
          }
          const id = randomBytes(32).toString("hex");
          sessions.set(id, now + 43200000);
          if (sessions.size > 100)
            sessions.delete(sessions.keys().next().value!);
          res.setHeader(
            "Set-Cookie",
            `agentd_session=${id}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`,
          );
          send(200, { ok: true });
          return;
        }
        const id = req.headers.cookie
          ?.split(";")
          .map((x) => x.trim())
          .find((x) => x.startsWith("agentd_session="))
          ?.slice(15);
        if (!id || (sessions.get(id) ?? 0) < Date.now()) {
          send(401, { error: "Sign in to continue" });
          return;
        }
        const accountOwner = createHash("sha256").update(id).digest("hex");
        // Never trust a browser-supplied actor: bind every mutation to its cookie.
        const call = (input: Record<string, any>) =>
          bridge({
            ...input,
            ...(gatewayMutations.has(input.op) ? { owner: accountOwner } : {}),
          });
        if (path === "/api/storage" && req.method === "POST") {
          const input = await body(req);
          if (!["preview", "cleanup"].includes(input.action))
            throw Error("Unsupported storage action");
          send(
            200,
            await call({
              op:
                input.action === "preview"
                  ? "storage-preview"
                  : "storage-cleanup",
              owner: accountOwner,
              ...(input.action === "cleanup"
                ? { fingerprint: input.fingerprint }
                : {}),
            }),
          );
          return;
        }
        if (path === "/api/account" && req.method === "GET") {
          send(200, await call({ op: "account-session", owner: accountOwner }));
          return;
        }
        if (path === "/api/account" && req.method === "POST") {
          const input = await body(req);
          if (!["start", "code", "cancel", "refresh"].includes(input.action)) {
            send(400, { error: "Unsupported account action" });
            return;
          }
          if (
            input.action === "start" &&
            (!["claude", "codex", "cursor"].includes(input.adapter) ||
              !["login", "logout"].includes(input.operation))
          ) {
            send(400, { error: "Unsupported account action" });
            return;
          }
          try {
            send(
              200,
              await call({
                op: "account-" + input.action,
                owner: accountOwner,
                adapter: input.adapter,
                action: input.operation,
                session: input.session,
                code: input.code,
              }),
            );
          } catch {
            send(400, {
              error:
                input.action === "start"
                  ? "Account change could not start. Wait for current work or another sign-in to finish, then try again."
                  : "Account step failed. Check the code or start a new sign-in.",
            });
          }
          return;
        }
        if (path === "/api/logout" && req.method === "POST") {
          try {
            const value = await call({
              op: "account-session",
              owner: accountOwner,
            });
            if (value?.session && value.busy)
              await call({
                op: "account-cancel",
                owner: accountOwner,
                session: value.session.id,
              });
          } catch {}
          sessions.delete(id);
          res.setHeader(
            "Set-Cookie",
            "agentd_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0",
          );
          send(200, { ok: true });
          return;
        }
        if (path === "/api/feedback" && req.method === "GET") {
          const parameters = new URL(req.url ?? "/", c.origin).searchParams;
          send(
            200,
            await call({
              op:
                parameters.get("targets") === "1"
                  ? "feedback-targets"
                  : "feedback-status",
              owner: accountOwner,
              task: parameters.get("task"),
            }),
          );
          return;
        }
        if (path === "/api/feedback" && req.method === "POST") {
          const input = await body(req);
          if (!["prepare", "apply"].includes(input.action))
            throw Error("Unsupported feedback action");
          send(
            200,
            await call({
              op: "feedback-" + input.action,
              owner: accountOwner,
              task: input.task,
              id: input.id,
              kind: input.kind,
              publication: input.publication,
              base: input.base,
              fingerprint: input.fingerprint,
              keys: input.keys,
              instruction: input.instruction,
            }),
          );
          return;
        }
        if (path === "/api/publishing" && req.method === "GET") {
          const params = new URL(req.url ?? "/", c.origin).searchParams;
          send(
            200,
            await call({
              op:
                params.get("targets") === "1"
                  ? "publication-targets"
                  : "publication-status",
              task: params.get("task"),
            }),
          );
          return;
        }
        if (path === "/api/publishing" && req.method === "POST") {
          const input = await body(req);
          if (!["preview", "approve"].includes(input.action))
            throw Error("Unsupported publishing action");
          send(
            200,
            await call({
              op: "publication-" + input.action,
              owner: accountOwner,
              task: input.task,
              id: input.id,
              fingerprint: input.fingerprint,
              updateOf: input.updateOf,
              base: input.base,
              title: input.title,
              body: input.body,
            }),
          );
          return;
        }
        if (path === "/api/check-setup" && req.method === "GET") {
          const url = new URL(req.url ?? "/", c.origin);
          send(
            200,
            await call({
              op: "check-setup",
              project: url.searchParams.get("project"),
              task: url.searchParams.get("task") || undefined,
            }),
          );
          return;
        }
        if (path === "/api/check-setup" && req.method === "POST") {
          const input = await body(req);
          if (!["prepare", "cancel"].includes(input.action))
            throw Error("Unsupported setup action");
          send(
            200,
            await call({
              op: input.action === "prepare" ? "check-prepare" : "check-cancel",
              project: input.project,
              task: input.task,
              fingerprint: input.fingerprint,
              id: input.id,
            }),
          );
          return;
        }
        if (path === "/api/github" && req.method === "GET") {
          send(200, await call({ op: "github-status", owner: accountOwner }));
          return;
        }
        if (path === "/api/github" && req.method === "POST") {
          const input = await body(req);
          if (!["start", "cancel", "logout"].includes(input.action))
            throw Error("Unsupported GitHub action");
          send(
            200,
            await call({
              op: "github-" + input.action,
              owner: accountOwner,
              session: input.session,
            }),
          );
          return;
        }
        if (path === "/api/repositories" && req.method === "GET") {
          send(200, await call({ op: "repository-jobs" }));
          return;
        }
        if (path === "/api/repositories" && req.method === "POST") {
          const input = await body(req);
          if (input.action === "cancel") {
            send(200, await call({ op: "repository-cancel", job: input.job }));
            return;
          }
          if (input.action !== "start")
            throw Error("Unsupported repository action");
          send(
            200,
            await call({
              op: "repository-start",
              kind: input.kind,
              url: input.url,
              branch: input.branch,
              name: input.name,
              project: input.project,
            }),
          );
          return;
        }
        if (path === "/api/settings" && req.method === "POST") {
          const input = await body(req);
          if (!["view", "save", "refresh-models"].includes(input.action))
            throw Error("Unsupported settings action");
          send(
            200,
            await call({
              op:
                input.action === "refresh-models"
                  ? "models-refresh"
                  : "settings-" + input.action,
              project: input.project,
              conversation: input.conversation,
              agent: input.agent,
              scope: input.scope,
              agentScope: input.agentScope,
              values: input.values,
              previous: input.previous,
              mode: input.mode,
              prompt: input.prompt,
              overrides: input.overrides,
              owner: accountOwner,
            }),
          );
          return;
        }
        if (path === "/api/capabilities" && req.method === "GET") {
          send(200, await call({ op: "capabilities" }));
          return;
        }
        if (path === "/api/operations" && req.method === "GET") {
          send(200, await call({ op: "operations" }));
          return;
        }
        const parameters = new URL(req.url ?? "/", c.origin).searchParams;
        if (path === "/api/history" && req.method === "GET") {
          send(
            200,
            await call({
              op: "history",
              query: parameters.get("q") ?? "",
              filter: parameters.get("filter") ?? "active",
              ...(parameters.has("before")
                ? { before: Number(parameters.get("before")) }
                : {}),
            }),
          );
          return;
        }
        if (path === "/api/archived-projects" && req.method === "GET") {
          send(200, await call({ op: "archived-projects" }));
          return;
        }
        const output = path.match(/^\/api\/tasks\/([0-9a-f-]{36})\/output$/);
        if (output && req.method === "GET") {
          const value = await call({ op: "task-output", id: output[1] });
          res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="agentd-${output[1]}.txt"`,
          });
          res.end(value.text);
          return;
        }
        const review = path.match(/^\/api\/tasks\/([0-9a-f-]{36})\/review$/);
        if (review && req.method === "GET") {
          send(200, await call({ op: "review", id: review[1] }));
          return;
        }
        if (path === "/api/projects" && req.method === "GET") {
          send(200, await call({ op: "projects" }));
          return;
        }
        const threads = path.match(
          /^\/api\/projects\/([0-9a-z-]+)\/conversations$/,
        );
        if (threads && req.method === "GET") {
          send(200, await call({ op: "conversations", project: threads[1] }));
          return;
        }
        const thread = path.match(/^\/api\/conversations\/([0-9a-f-]{36})$/);
        if (thread && req.method === "GET") {
          send(
            200,
            await call({
              op: "conversation-show",
              id: thread[1],
              ...(parameters.has("before")
                ? { before: Number(parameters.get("before")) }
                : {}),
            }),
          );
          return;
        }
        if (path === "/api/tasks" && req.method === "GET") {
          send(200, await call({ op: "list" }));
          return;
        }
        const match = path.match(/^\/api\/tasks\/([0-9a-f-]{36})$/);
        if (match && req.method === "GET") {
          send(200, await call({ op: "show", id: match[1] }));
          return;
        }
        if (path === "/api/action" && req.method === "POST") {
          const input = await body(req);
          if (
            ![
              "create",
              "retry",
              "restart-settings",
              "revise",
              "approve",
              "cancel",
              "validate",
              "commit",
              "discard",
              "project-create",
              "project-rename",
              "conversation-rename",
              "conversation-archive",
              "conversation-restore",
              "project-archive",
              "project-restore",
            ].includes(input.op)
          )
            throw new Error("Unsupported action");
          if (
            input.op === "approve" &&
            (typeof input.fingerprint !== "string" ||
              !/^[0-9a-f]{64}$/.test(input.fingerprint))
          )
            throw Error("Refresh the run preview before approving.");
          send(200, await call(input));
          return;
        }
        if (path === "/api/upload" && req.method === "POST") {
          const input = await body(req);
          send(
            201,
            await call({
              op: "attachment-upload",
              name: input.name,
              data: input.data,
            }),
          );
          return;
        }
        const img = path.match(/^\/api\/images\/([0-9a-f-]{36})$/);
        if (img && req.method === "GET") {
          const value = await call({ op: "attachment-read", id: img[1] });
          res.writeHead(200, {
            "Content-Type": value.ext === ".png" ? "image/png" : "image/jpeg",
          });
          res.end(Buffer.from(value.data, "base64"));
          return;
        }
        send(404, { error: "Not found" });
      } catch (error) {
        send(400, { error: publicError(error) });
      }
    },
  );
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  server.listen(c.port, c.host);
  return server;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  process.umask(0o077);
  const config = JSON.parse(
    readFileSync(
      process.env.AGENTD_MOBILE_CONFIG ?? "/etc/agentd/mobile.json",
      "utf8",
    ),
  );
  const server = mobile({
    socket: "/run/agentd/control.sock",
    attachments: "/srv/agentd/state/attachments",
    publicDir: "/opt/agentd/public",
    ...config,
  });
  server.on("listening", () =>
    console.log(
      JSON.stringify({ event: "mobile_listening", origin: config.origin }),
    ),
  );
  server.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
  process.on("SIGTERM", () => {
    server.close();
    server.closeAllConnections();
  });
}
