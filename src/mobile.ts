import { publicError, browserResult } from "./public-errors.ts";
import { accessKeyHash, accessKeyMatches, validateAccessKey } from "./access-key.ts";
import { gatewayRequest, gatewayMutations } from "./gateway-protocol.ts";
import { createServer } from "node:https";
import { createConnection } from "node:net";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import type { IncomingMessage, ServerResponse } from "node:http";
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
/** A failure after headers cannot become a second status response; end the
 * connection so the client settles instead of waiting for an unfinished body. */
export function failResponse(
  res: ServerResponse,
  send: (status: number, value: unknown) => void,
  error: unknown,
) {
  if (res.headersSent) {
    console.error("agentd-mobile: response failed after headers were sent");
    res.destroy();
    return;
  }
  send(400, { error: publicError(error) });
}
export function mobile(c: Config) {
  const sessions = new Map<string, number>(),
    attempts = new Map<string, { count: number; until: number }>(),
    rollbackPreviews = new Map<
      string,
      { fingerprint: string; version: string; expires: number }
    >(),
    updatePreviews = new Map<
      string,
      { fingerprint: string; version: string; expires: number }
    >(),
    accessPreviews = new Map<
      string,
      { fingerprint: string; newHash: string; expires: number }
    >(),
    serviceRestartPreviews = new Map<
      string,
      {
        fingerprint: string;
        target: "runner" | "gateway";
        expires: number;
        requiresIdle: boolean;
      }
    >(),
    backupPreviews = new Map<
      string,
      { fingerprint: string; inventory: string; expires: number; eligible: number }
    >(),
    restorePreviews = new Map<
      string,
      {
        fingerprint: string;
        id: string;
        version: string;
        completedAt: number;
        expires: number;
      }
    >(),
    adapterPreviews = new Map<
      string,
      {
        fingerprint: string;
        inventory: string;
        expires: number;
        enabled: string[];
        editing: boolean;
        editAdapters: string[];
        requiresIdle: boolean;
      }
    >(),
    runtimeFlagPreviews = new Map<
      string,
      {
        fingerprint: string;
        inventory: string;
        expires: number;
        flags: {
          strictWorkers: boolean;
          credentialRenewal: boolean;
          codexChat: boolean;
        };
        requiresIdle: boolean;
      }
    >(),
    tlsPreviews = new Map<
      string,
      {
        fingerprint: string;
        inventory: string;
        expires: number;
        certificate: string;
        key: string;
        requiresIdle: boolean;
      }
    >(),
    cliPreviews = new Map<
      string,
      {
        fingerprint: string;
        inventory: string;
        expires: number;
        id: string;
        requiresIdle: boolean;
      }
    >(),
    profilePreviews = new Map<
      string,
      {
        fingerprint: string;
        inventory: string;
        expires: number;
        target: "resource" | "hardening";
        requiresIdle: boolean;
      }
    >(),
    recoveryPreviews = new Map<
      string,
      {
        fingerprint: string;
        expires: number;
      }
    >(),
    notificationPreviews = new Map<
      string,
      {
        fingerprint: string;
        inventory: string;
        expires: number;
        settings:
          { clear: true } | { server: string; topic: string } | { paused: boolean };
      }
    >(),
    originPreviews = new Map<
      string,
      {
        fingerprint: string;
        inventory: string;
        expires: number;
        settings: { origin: string };
      }
    >();
  let accessHash = c.accessHash;
  const bridge = (input: unknown) =>
    new Promise<any>((resolve, reject) => {
      const encoded = JSON.stringify(gatewayRequest(input)) + "\n";
      const s = createConnection(c.socket);
      let text = "";
      const op = (input as any)?.op;
      s.setTimeout(op === "admin-tls-replace" ? 25000 : 10000, () =>
        s.destroy(new Error("Runner timed out")),
      );
      s.on("connect", () => s.write(encoded));
      s.on("data", (b) => {
        text += b;
        if (Buffer.byteLength(text) > (op === "attachment-read" ? 8_000_000 : 4_000_000))
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
            "/request-id.js",
            "/style.css",
            "/fonts/geist-400.ttf",
            "/fonts/geist-500.ttf",
            "/fonts/geist-600.ttf",
          ].includes(path)
        ) {
          const file = path === "/" ? "index.html" : path.slice(1);
          const body = readFileSync(join(c.publicDir, file));
          res.writeHead(200, {
            "Content-Type": file.endsWith(".html")
              ? "text/html; charset=utf-8"
              : file.endsWith(".js")
                ? "text/javascript"
                : file.endsWith(".ttf")
                  ? "font/ttf"
                  : "text/css",
          });
          res.end(body);
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
          for (const [key, value] of sessions) if (value < now) sessions.delete(key);
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
          if (!accessKeyMatches(input.key, accessHash)) {
            send(401, { error: "Access key did not match" });
            return;
          }
          const id = randomBytes(32).toString("hex");
          sessions.set(id, now + 43200000);
          if (sessions.size > 100) sessions.delete(sessions.keys().next().value!);
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
        if (path === "/api/updates" && req.method === "GET") {
          send(200, await call({ op: "admin-updates" }));
          return;
        }
        if (path === "/api/updates" && req.method === "POST") {
          // Installing restarts every service: re-check the access key, bind the
          // approval to a fresh preview and share the sign-in rate limit.
          const limitKey = "updates:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const previews of [updatePreviews, rollbackPreviews])
            for (const [owner, preview] of previews)
              if (preview.expires < now) previews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (input.action === "preview") {
            const value = await call({ op: "admin-updates" }),
              candidate = value.candidates?.find(
                (item: any) => item.version === input.version,
              );
            if (!candidate?.valid || !candidate.newer)
              throw Error("Choose a newer approved release.");
            if (value.configuration !== "ok")
              throw Error("Server configuration needs review before updating.");
            if (value.running) throw Error("An update is already running.");
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-update-preview:${accountOwner}:${value.installed.version}:${candidate.version}:${candidate.revision}:${expires}:${nonce}`,
                )
                .digest("hex");
            updatePreviews.set(accountOwner, {
              fingerprint,
              version: candidate.version,
              expires,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              installed: value.installed,
              release: candidate,
            });
            return;
          }
          if (input.action === "install") {
            const preview = updatePreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              input.version !== preview.version
            )
              throw Error("Update preview expired. Review it again.");
            if (input.confirmed !== true)
              throw Error("Confirm that services will restart during the update.");
            updatePreviews.delete(accountOwner);
            await call({ op: "admin-update-start", version: preview.version });
            send(202, { started: true, version: preview.version });
            return;
          }
          if (input.action === "rollback-preview") {
            const value = await call({ op: "admin-updates" }),
              target = value.rollback;
            if (!target?.available)
              throw Error(target?.reason ?? "No earlier version is available.");
            if (value.configuration !== "ok")
              throw Error("Server configuration needs review before rolling back.");
            if (value.running) throw Error("An update or rollback is already running.");
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-rollback-preview:${accountOwner}:${value.installed.version}:${target.version}:${target.completedAt}:${expires}:${nonce}`,
                )
                .digest("hex");
            rollbackPreviews.set(accountOwner, {
              fingerprint,
              version: target.version,
              expires,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              installed: value.installed,
              rollback: target,
            });
            return;
          }
          if (input.action === "rollback") {
            const preview = rollbackPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              input.version !== preview.version
            )
              throw Error("Rollback preview expired. Review it again.");
            if (input.confirmed !== true)
              throw Error(
                "Confirm that services restart and newer task data is set aside during the rollback.",
              );
            rollbackPreviews.delete(accountOwner);
            await call({ op: "admin-rollback-start", version: preview.version });
            send(202, { started: true, version: preview.version });
            return;
          }
          throw Error("Unsupported update action.");
        }
        if (path === "/api/access-key" && req.method === "POST") {
          // The current key is re-checked here; limit guesses like the sign-in form.
          const limitKey = "access-key:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of accessPreviews)
            if (preview.expires < now) accessPreviews.delete(owner);
          if (input.action === "preview") {
            if (!accessKeyMatches(input.currentKey, accessHash))
              throw Error("Current access key did not match.");
            const generated = input.mode === "generated";
            if (!generated && input.mode !== "custom")
              throw Error("Choose a generated or custom access key.");
            const newKey = generated
              ? randomBytes(32).toString("base64url")
              : validateAccessKey(input.newKey);
            const newHash = accessKeyHash(newKey);
            if (newHash === accessHash) throw Error("New access key must be different.");
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-access-key-preview:${accountOwner}:${accessHash}:${newHash}:${expires}:${nonce}`,
                )
                .digest("hex");
            accessPreviews.set(accountOwner, { fingerprint, newHash, expires });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              generatedKey: generated ? newKey : null,
              invalidatesOtherSessions: Math.max(0, sessions.size - 1),
            });
            return;
          }
          if (input.action === "approve") {
            const preview = accessPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint
            )
              throw Error("Access-key preview expired. Review it again.");
            if (!input.saved || !accessKeyMatches(input.currentKey, accessHash))
              throw Error("Confirm the saved key and enter the current key again.");
            const newKey = validateAccessKey(input.newKey);
            if (accessKeyHash(newKey) !== preview.newHash)
              throw Error("The new access key changed. Review it again.");
            await call({
              op: "admin-access-rotate",
              currentKey: input.currentKey,
              newHash: preview.newHash,
            });
            const invalidated = Math.max(0, sessions.size - 1);
            accessHash = preview.newHash;
            for (const session of sessions.keys())
              if (session !== id) sessions.delete(session);
            accessPreviews.clear();
            send(200, { rotated: true, invalidated });
            return;
          }
          throw Error("Unsupported access-key action.");
        }
        if (path === "/api/access-key-recovery" && req.method === "GET") {
          send(200, await call({ op: "admin-access-key-recovery" }));
          return;
        }
        if (path === "/api/access-key-recovery" && req.method === "POST") {
          const limitKey =
              "access-key-recovery:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of recoveryPreviews)
            if (preview.expires < now) recoveryPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (input.action === "preview") {
            const current = await call({ op: "admin-access-key-recovery" });
            if (!current.present) throw Error("Access-key recovery file is not present.");
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-access-key-recovery-preview:${accountOwner}:${accessHash}:${expires}:${nonce}`,
                )
                .digest("hex");
            recoveryPreviews.set(accountOwner, { fingerprint, expires });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              present: true,
            });
            return;
          }
          if (input.action === "delete") {
            const preview = recoveryPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint
            )
              throw Error("Access-key recovery preview expired. Review it again.");
            if (input.confirmed !== true)
              throw Error("Confirm deletion of the access-key recovery file.");
            const current = await call({ op: "admin-access-key-recovery" });
            if (!current.present) throw Error("Access-key recovery file is not present.");
            recoveryPreviews.delete(accountOwner);
            const result = await call({
              op: "admin-access-key-recovery-delete",
              currentKey: input.currentKey,
            });
            send(200, result);
            return;
          }
          throw Error("Unsupported access-key recovery action.");
        }
        if (path === "/api/notifications" && req.method === "GET") {
          send(200, await call({ op: "admin-notifications" }));
          return;
        }
        if (path === "/api/notifications" && req.method === "POST") {
          const limitKey = "notifications:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of notificationPreviews)
            if (preview.expires < now) notificationPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (input.action === "preview") {
            const current = await call({ op: "admin-notifications" });
            const settingsInput =
              input.settings && typeof input.settings === "object"
                ? (input.settings as Record<string, unknown>)
                : null;
            const clear = input.clear === true || settingsInput?.clear === true;
            const pausedValue =
              typeof input.paused === "boolean"
                ? input.paused
                : typeof settingsInput?.paused === "boolean"
                  ? settingsInput.paused
                  : undefined;
            let settings:
              { clear: true } | { server: string; topic: string } | { paused: boolean };
            if (clear) settings = { clear: true };
            else if (typeof pausedValue === "boolean") {
              if (!current.configured)
                throw Error(
                  "Configure an ntfy destination before pausing notifications.",
                );
              settings = { paused: pausedValue };
            } else {
              const server =
                typeof input.server === "string"
                  ? input.server
                  : typeof settingsInput?.server === "string"
                    ? settingsInput.server
                    : null;
              const topic =
                typeof input.topic === "string"
                  ? input.topic
                  : typeof settingsInput?.topic === "string"
                    ? settingsInput.topic
                    : null;
              if (typeof server !== "string" || typeof topic !== "string")
                throw Error("Enter an https ntfy server and topic.");
              settings = {
                server: server.replace(/\/+$/, ""),
                topic: topic.trim(),
              };
            }
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-notifications-preview:${accountOwner}:${current.fingerprint}:${JSON.stringify(settings)}:${expires}:${nonce}`,
                )
                .digest("hex");
            notificationPreviews.set(accountOwner, {
              fingerprint,
              inventory: current.fingerprint,
              expires,
              settings,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              settings,
              inventory: current.fingerprint,
            });
            return;
          }
          if (input.action === "apply") {
            const preview = notificationPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              JSON.stringify(input.settings) !== JSON.stringify(preview.settings)
            )
              throw Error("Notification settings preview expired. Review it again.");
            if (input.confirmed !== true)
              throw Error("Confirm the notification settings change.");
            const current = await call({ op: "admin-notifications" });
            if (current.fingerprint !== preview.inventory)
              throw Error("Notification settings changed. Review it again.");
            notificationPreviews.delete(accountOwner);
            const result = await call({
              op: "admin-notifications-apply",
              settings: preview.settings,
            });
            send(200, result);
            return;
          }
          throw Error("Unsupported notifications action.");
        }
        if (path === "/api/origin" && req.method === "GET") {
          send(200, await call({ op: "admin-origin" }));
          return;
        }
        if (path === "/api/origin" && req.method === "POST") {
          const limitKey = "origin:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of originPreviews)
            if (preview.expires < now) originPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (input.action === "preview") {
            const current = await call({ op: "admin-origin" });
            if (typeof input.origin !== "string")
              throw Error("Enter an https origin with host and optional port only.");
            const settings = { origin: input.origin.trim().replace(/\/+$/, "") };
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-origin-preview:${accountOwner}:${current.fingerprint}:${JSON.stringify(settings)}:${expires}:${nonce}`,
                )
                .digest("hex");
            originPreviews.set(accountOwner, {
              fingerprint,
              inventory: current.fingerprint,
              expires,
              settings,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              settings,
              inventory: current.fingerprint,
            });
            return;
          }
          if (input.action === "apply") {
            const preview = originPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              JSON.stringify(input.settings) !== JSON.stringify(preview.settings)
            )
              throw Error("Origin settings preview expired. Review it again.");
            if (input.confirmed !== true)
              throw Error("Confirm the origin settings change.");
            const current = await call({ op: "admin-origin" });
            if (current.fingerprint !== preview.inventory)
              throw Error("Origin settings changed. Review it again.");
            originPreviews.delete(accountOwner);
            const result = await call({
              op: "admin-origin-apply",
              settings: preview.settings,
            });
            send(200, result);
            return;
          }
          throw Error("Unsupported origin action.");
        }
        if (path === "/api/service-restart" && req.method === "POST") {
          const limitKey = "service-restart:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of serviceRestartPreviews)
            if (preview.expires < now) serviceRestartPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (input.target !== "runner" && input.target !== "gateway")
            throw Error("Choose the task runner or phone gateway.");
          if (input.action === "preview") {
            const plan = await call({
                op: "admin-service-restart-plan",
                target: input.target,
              }),
              updates = await call({ op: "admin-updates" }).catch(() => null);
            if (updates?.running)
              throw Error("An update or rollback is already running.");
            if (updates && updates.configuration !== "ok")
              throw Error("Server configuration needs review before restarting.");
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-service-restart-preview:${accountOwner}:${input.target}:${plan.idle}:${expires}:${nonce}`,
                )
                .digest("hex");
            serviceRestartPreviews.set(accountOwner, {
              fingerprint,
              target: input.target,
              expires,
              requiresIdle: !plan.idle,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              target: input.target,
              label: plan.label,
              requiresIdle: !plan.idle,
            });
            return;
          }
          if (input.action === "restart") {
            const preview = serviceRestartPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              input.target !== preview.target
            )
              throw Error("Service restart preview expired. Review it again.");
            if (preview.requiresIdle && input.confirmedIdle !== true)
              throw Error(
                "Confirm that current work is stopped before restarting services.",
              );
            serviceRestartPreviews.delete(accountOwner);
            await call({ op: "admin-service-restart", target: preview.target });
            send(202, { restarted: true, target: preview.target });
            return;
          }
          throw Error("Unsupported service restart action.");
        }
        if (path === "/api/backups" && req.method === "GET") {
          send(200, await call({ op: "admin-backups" }));
          return;
        }
        if (path === "/api/backups" && req.method === "POST") {
          const limitKey = "backups:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of backupPreviews)
            if (preview.expires < now) backupPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (input.action === "preview") {
            const value = await call({ op: "admin-backups" }),
              eligible = (value.items ?? []).filter((item: any) => item.eligible).length;
            if (value.blocked)
              throw Error("Resolve pending recovery before cleaning backups.");
            if (!eligible) throw Error("No eligible managed backups to remove.");
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-backups-prune-preview:${accountOwner}:${value.fingerprint}:${eligible}:${expires}:${nonce}`,
                )
                .digest("hex");
            backupPreviews.set(accountOwner, {
              fingerprint,
              inventory: value.fingerprint,
              expires,
              eligible,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              inventory: value.fingerprint,
              eligible,
              keep: value.keep,
              minimumAgeDays: value.minimumAgeDays,
            });
            return;
          }
          if (input.action === "prune") {
            const preview = backupPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint
            )
              throw Error("Backup cleanup preview expired. Review it again.");
            if (input.confirmed !== true)
              throw Error("Confirm removal of eligible managed backups.");
            const current = await call({ op: "admin-backups" });
            if (current.fingerprint !== preview.inventory)
              throw Error("Backup inventory changed. Review it again.");
            backupPreviews.delete(accountOwner);
            const result = await call({
              op: "admin-backups-prune",
              fingerprint: preview.inventory,
            });
            send(200, result);
            return;
          }
          if (input.action === "restore-preview") {
            if (
              typeof input.id !== "string" ||
              !/^agentd-backup-[a-z0-9_]{4,32}$/.test(input.id)
            )
              throw Error("Backup restore request is invalid.");
            const value = await call({ op: "admin-backups" }),
              item = (value.items ?? []).find((entry: any) => entry.id === input.id);
            if (!value.restoreEnabled)
              throw Error("Selected backup restore is not installed.");
            if (!item?.restorable) throw Error("That managed backup cannot be restored");
            const updates = await call({ op: "admin-updates" });
            if (updates.configuration !== "ok")
              throw Error("Server configuration needs review before restoring a backup.");
            if (updates.running) throw Error("An update or rollback is already running.");
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-backups-restore-preview:${accountOwner}:${item.id}:${item.version}:${item.completedAt}:${expires}:${nonce}`,
                )
                .digest("hex");
            restorePreviews.set(accountOwner, {
              fingerprint,
              id: item.id,
              version: item.version,
              completedAt: item.completedAt,
              expires,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              installed: updates.installed,
              restore: {
                id: item.id,
                version: item.version,
                completedAt: item.completedAt,
                bytes: item.bytes,
                rollbackTarget: item.rollbackTarget === true,
              },
            });
            return;
          }
          if (input.action === "restore") {
            const preview = restorePreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              input.id !== preview.id
            )
              throw Error("Backup restore preview expired. Review it again.");
            if (input.confirmed !== true)
              throw Error(
                "Confirm that services restart and newer task data is set aside during the restore.",
              );
            restorePreviews.delete(accountOwner);
            const result = await call({ op: "admin-backups-restore", id: preview.id });
            send(202, result);
            return;
          }
          throw Error("Unsupported backups action.");
        }
        if (path === "/api/cli" && req.method === "GET") {
          send(200, await call({ op: "admin-cli" }));
          return;
        }
        if (path === "/api/cli" && req.method === "POST") {
          const limitKey = "cli:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of cliPreviews)
            if (preview.expires < now) cliPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (
            typeof input.id !== "string" ||
            !/^(?:cursor_[0-9]{4}\.[0-9]{2}\.[0-9]{2}-[a-f0-9]{7,12}|claude_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4}|codex_[0-9]{1,4}\.[0-9]{1,4}\.[0-9]{1,4})$/.test(
              input.id,
            )
          )
            throw Error("Choose an approved CLI package.");
          if (input.action === "preview") {
            const current = await call({ op: "admin-cli" }),
              item = (current.items ?? []).find((entry: any) => entry.id === input.id),
              plan = await call({
                op: "admin-service-restart-plan",
                target: "runner",
              });
            if (!item) throw Error("That CLI approval is not available.");
            if (current.running) throw Error("A CLI install is already running.");
            const inventory = createHash("sha256")
                .update(JSON.stringify(current.items ?? []))
                .digest("hex"),
              expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-cli-install-preview:${accountOwner}:${inventory}:${input.id}:${expires}:${nonce}`,
                )
                .digest("hex");
            cliPreviews.set(accountOwner, {
              fingerprint,
              inventory,
              expires,
              id: input.id,
              requiresIdle: !plan.idle,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              id: input.id,
              adapter: item.adapter,
              version: item.version,
              notes: item.notes ?? "",
              requiresIdle: !plan.idle,
            });
            return;
          }
          if (input.action === "install") {
            const preview = cliPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              input.id !== preview.id
            )
              throw Error("CLI install preview expired. Review it again.");
            if (preview.requiresIdle && input.confirmedIdle !== true)
              throw Error(
                "Confirm that current work is stopped before installing a CLI.",
              );
            if (input.confirmed !== true) throw Error("Confirm the CLI install.");
            const current = await call({ op: "admin-cli" }),
              inventory = createHash("sha256")
                .update(JSON.stringify(current.items ?? []))
                .digest("hex");
            if (inventory !== preview.inventory)
              throw Error("Approved CLI list changed. Review it again.");
            if (current.running) throw Error("A CLI install is already running.");
            cliPreviews.delete(accountOwner);
            const result = await call({ op: "admin-cli-install", id: preview.id });
            send(200, result);
            return;
          }
          throw Error("Unsupported CLI action.");
        }
        if (path === "/api/adapters" && req.method === "GET") {
          send(200, await call({ op: "admin-adapters" }));
          return;
        }
        if (path === "/api/adapters" && req.method === "POST") {
          const limitKey = "adapters:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now(),
            allowed = new Set(["claude", "codex", "cursor"]);
          for (const [owner, preview] of adapterPreviews)
            if (preview.expires < now) adapterPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          const enabled = Array.isArray(input.enabled) ? input.enabled.map(String) : null,
            editAdapters = Array.isArray(input.editAdapters)
              ? input.editAdapters.map(String)
              : [],
            editing = input.editing === true;
          if (
            !enabled ||
            !enabled.length ||
            enabled.length > 3 ||
            enabled.some((item: string) => !allowed.has(item)) ||
            new Set(enabled).size !== enabled.length ||
            editAdapters.length > 3 ||
            editAdapters.some((item: string) => !allowed.has(item)) ||
            new Set(editAdapters).size !== editAdapters.length ||
            (editing && !editAdapters.length) ||
            editAdapters.some((item: string) => !enabled.includes(item))
          )
            throw Error("Choose at least one supported agent adapter.");
          if (input.action === "preview") {
            const current = await call({ op: "admin-adapters" }),
              plan = await call({
                op: "admin-service-restart-plan",
                target: "runner",
              });
            const expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-adapters-apply-preview:${accountOwner}:${current.fingerprint}:${enabled.join(",")}:${editing}:${editAdapters.join(",")}:${expires}:${nonce}`,
                )
                .digest("hex");
            adapterPreviews.set(accountOwner, {
              fingerprint,
              inventory: current.fingerprint,
              expires,
              enabled,
              editing,
              editAdapters: editing ? editAdapters : [],
              requiresIdle: !plan.idle,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              inventory: current.fingerprint,
              enabled,
              editing,
              editAdapters: editing ? editAdapters : [],
              requiresIdle: !plan.idle,
              requiresRestart: true,
            });
            return;
          }
          if (input.action === "apply") {
            const preview = adapterPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              JSON.stringify(input.enabled) !== JSON.stringify(preview.enabled) ||
              input.editing !== preview.editing ||
              JSON.stringify(input.editAdapters ?? []) !==
                JSON.stringify(preview.editAdapters)
            )
              throw Error("Adapter policy preview expired. Review it again.");
            if (preview.requiresIdle && input.confirmedIdle !== true)
              throw Error(
                "Confirm that current work is stopped before changing adapter policy.",
              );
            if (input.confirmed !== true)
              throw Error("Confirm the adapter policy change.");
            const current = await call({ op: "admin-adapters" });
            if (current.fingerprint !== preview.inventory)
              throw Error("Adapter policy changed. Review it again.");
            adapterPreviews.delete(accountOwner);
            const result = await call({
              op: "admin-adapters-apply",
              enabled: preview.enabled,
              editing: preview.editing,
              editAdapters: preview.editAdapters,
            });
            send(200, result);
            return;
          }
          throw Error("Unsupported adapter policy action.");
        }
        if (path === "/api/runtime-flags" && req.method === "GET") {
          send(200, await call({ op: "admin-runtime-flags" }));
          return;
        }
        if (path === "/api/runtime-flags" && req.method === "POST") {
          const limitKey = "runtime-flags:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of runtimeFlagPreviews)
            if (preview.expires < now) runtimeFlagPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          const flags = {
            strictWorkers: input.flags?.strictWorkers === true,
            credentialRenewal: input.flags?.credentialRenewal === true,
            codexChat: input.flags?.codexChat === true,
          };
          if ((flags.credentialRenewal || flags.codexChat) && !flags.strictWorkers)
            throw Error(
              "Turn on hardened workers before credential renewal or Codex chat.",
            );
          if (input.action === "preview") {
            const current = await call({ op: "admin-runtime-flags" }),
              plan = await call({
                op: "admin-service-restart-plan",
                target: "runner",
              }),
              expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-runtime-flags-preview:${accountOwner}:${current.fingerprint}:${flags.strictWorkers}:${flags.credentialRenewal}:${flags.codexChat}:${expires}:${nonce}`,
                )
                .digest("hex");
            runtimeFlagPreviews.set(accountOwner, {
              fingerprint,
              inventory: current.fingerprint,
              expires,
              flags,
              requiresIdle: !plan.idle,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              inventory: current.fingerprint,
              flags,
              requiresIdle: !plan.idle,
              requiresRestart: true,
            });
            return;
          }
          if (input.action === "apply") {
            const preview = runtimeFlagPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              JSON.stringify(input.flags) !== JSON.stringify(preview.flags)
            )
              throw Error("Runtime flags preview expired. Review it again.");
            if (preview.requiresIdle && input.confirmedIdle !== true)
              throw Error(
                "Confirm that current work is stopped before changing runtime flags.",
              );
            if (input.confirmed !== true)
              throw Error("Confirm the runtime flags change.");
            const current = await call({ op: "admin-runtime-flags" });
            if (current.fingerprint !== preview.inventory)
              throw Error("Runtime flags changed. Review it again.");
            runtimeFlagPreviews.delete(accountOwner);
            const result = await call({
              op: "admin-runtime-flags-apply",
              flags: preview.flags,
            });
            send(200, result);
            return;
          }
          throw Error("Unsupported runtime flags action.");
        }
        if (path === "/api/tls" && req.method === "POST") {
          const limitKey = "tls:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of tlsPreviews)
            if (preview.expires < now) tlsPreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (
            typeof input.certificate !== "string" ||
            typeof input.key !== "string" ||
            input.certificate.length > 16384 ||
            input.key.length > 16384
          )
            throw Error("TLS certificate request is invalid.");
          if (input.action === "preview") {
            const current = await call({ op: "admin-configuration" }),
              plan = await call({
                op: "admin-service-restart-plan",
                target: "gateway",
              }),
              inventory =
                typeof current.tls?.fingerprintSha256 === "string"
                  ? current.tls.fingerprintSha256
                  : "none",
              expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              material = createHash("sha256")
                .update(input.certificate)
                .update("\0")
                .update(input.key)
                .digest("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-tls-replace-preview:${accountOwner}:${inventory}:${material}:${expires}:${nonce}`,
                )
                .digest("hex");
            tlsPreviews.set(accountOwner, {
              fingerprint,
              inventory,
              expires,
              certificate: input.certificate,
              key: input.key,
              requiresIdle: !plan.idle,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              inventory,
              subject: current.tls?.subject ?? null,
              certificateExpires: current.tls?.certificateExpires ?? null,
              requiresIdle: !plan.idle,
              requiresRestart: true,
            });
            return;
          }
          if (input.action === "apply") {
            const preview = tlsPreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              input.certificate !== preview.certificate ||
              input.key !== preview.key
            )
              throw Error("TLS certificate preview expired. Review it again.");
            if (preview.requiresIdle && input.confirmedIdle !== true)
              throw Error(
                "Confirm that current work is stopped before replacing the TLS certificate.",
              );
            if (input.confirmed !== true)
              throw Error("Confirm the TLS certificate change.");
            const current = await call({ op: "admin-configuration" }),
              inventory =
                typeof current.tls?.fingerprintSha256 === "string"
                  ? current.tls.fingerprintSha256
                  : "none";
            if (inventory !== preview.inventory)
              throw Error("TLS certificate changed. Review it again.");
            tlsPreviews.delete(accountOwner);
            const result = await call({
              op: "admin-tls-replace",
              certificate: preview.certificate,
              key: preview.key,
            });
            send(200, result);
            return;
          }
          throw Error("Unsupported TLS action.");
        }
        if (path === "/api/profiles" && req.method === "GET") {
          send(200, await call({ op: "admin-profiles" }));
          return;
        }
        if (path === "/api/profiles" && req.method === "POST") {
          const limitKey = "profiles:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req),
            now = Date.now();
          for (const [owner, preview] of profilePreviews)
            if (preview.expires < now) profilePreviews.delete(owner);
          if (!accessKeyMatches(input.currentKey, accessHash))
            throw Error("Current access key did not match.");
          if (input.target !== "resource" && input.target !== "hardening")
            throw Error("Choose a configuration profile to enable.");
          if (input.action === "preview") {
            const current = await call({ op: "admin-profiles" }),
              plan = await call({
                op: "admin-service-restart-plan",
                target: "runner",
              });
            if (current.running) throw Error("A profile apply job is already running.");
            if (!current.jobsEnabled)
              throw Error("Configuration profile jobs are not enabled.");
            if (input.target === "resource" && !current.canEnableResource)
              throw Error("Standard resource profile is not available to enable.");
            if (input.target === "hardening" && !current.canEnableHardening)
              throw Error("Gateway hardening is not available to enable.");
            const inventory = createHash("sha256")
                .update(
                  JSON.stringify({
                    resourceProfile: current.resourceProfile,
                    gatewayHardening: current.gatewayHardening,
                    jobsEnabled: current.jobsEnabled,
                  }),
                )
                .digest("hex"),
              expires = now + 300000,
              nonce = randomBytes(24).toString("hex"),
              fingerprint = createHash("sha256")
                .update(
                  `agentd-profiles-enable-preview:${accountOwner}:${inventory}:${input.target}:${expires}:${nonce}`,
                )
                .digest("hex");
            profilePreviews.set(accountOwner, {
              fingerprint,
              inventory,
              expires,
              target: input.target,
              requiresIdle: !plan.idle,
            });
            send(200, {
              fingerprint,
              expiresAt: new Date(expires).toISOString(),
              target: input.target,
              label:
                input.target === "resource"
                  ? "Standard resource profile"
                  : "Gateway hardening profile",
              requiresIdle: !plan.idle,
            });
            return;
          }
          if (input.action === "enable") {
            const preview = profilePreviews.get(accountOwner);
            if (
              !preview ||
              preview.expires < now ||
              input.fingerprint !== preview.fingerprint ||
              input.target !== preview.target
            )
              throw Error("Configuration profile preview expired. Review it again.");
            if (preview.requiresIdle && input.confirmedIdle !== true)
              throw Error(
                "Confirm that current work is stopped before enabling a configuration profile.",
              );
            if (input.confirmed !== true)
              throw Error("Confirm the configuration profile enable.");
            const current = await call({ op: "admin-profiles" }),
              inventory = createHash("sha256")
                .update(
                  JSON.stringify({
                    resourceProfile: current.resourceProfile,
                    gatewayHardening: current.gatewayHardening,
                    jobsEnabled: current.jobsEnabled,
                  }),
                )
                .digest("hex");
            if (inventory !== preview.inventory)
              throw Error("Configuration profiles changed. Review it again.");
            if (current.running) throw Error("A profile apply job is already running.");
            profilePreviews.delete(accountOwner);
            const result = await call({
              op: "admin-profiles-enable",
              target: preview.target,
            });
            send(202, result);
            return;
          }
          throw Error("Unsupported profiles action.");
        }
        if (path === "/api/storage" && req.method === "POST") {
          const input = await body(req);
          if (!["preview", "cleanup"].includes(input.action))
            throw Error("Unsupported storage action");
          send(
            200,
            await call({
              op: input.action === "preview" ? "storage-preview" : "storage-cleanup",
              owner: accountOwner,
              ...(input.action === "cleanup" ? { fingerprint: input.fingerprint } : {}),
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
          if (!["prepare", "apply", "cancel"].includes(input.action))
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
              access: input.access,
            }),
          );
          return;
        }
        if (path === "/api/local-folder" && req.method === "POST") {
          const limitKey = "local-folder:" + (req.socket.remoteAddress ?? "unknown"),
            started = Date.now();
          for (const [key, value] of attempts)
            if (value.until < started) attempts.delete(key);
          const attempt = attempts.get(limitKey) ?? { count: 0, until: started + 60000 };
          if (attempt.count >= 10) {
            send(429, { error: "Too many attempts. Try again in one minute." });
            return;
          }
          attempt.count++;
          attempts.set(limitKey, attempt);
          const input = await body(req);
          if (input.action === "cancel") {
            send(200, await call({ op: "local-folder-cancel", owner: accountOwner }));
            return;
          }
          if (input.action === "preview") {
            send(
              200,
              await call({
                op: "local-folder-preview",
                owner: accountOwner,
                name: input.name,
                path: input.path,
              }),
            );
            return;
          }
          if (input.action === "approve") {
            if (!accessKeyMatches(input.currentKey, accessHash))
              throw Error("Current access key did not match.");
            send(
              200,
              await call({
                op: "local-folder-approve",
                owner: accountOwner,
                fingerprint: input.fingerprint,
              }),
            );
            return;
          }
          throw Error("Unsupported local folder action");
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
          if (input.action !== "start") throw Error("Unsupported repository action");
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
        if (path === "/api/diagnostics" && req.method === "GET") {
          send(200, await call({ op: "admin-diagnostics" }));
          return;
        }
        if (path === "/api/configuration" && req.method === "GET") {
          send(200, await call({ op: "admin-configuration" }));
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
          if (typeof value?.text !== "string") throw Error("Unexpected runner response");
          res.writeHead(200, {
            "Content-Type": "text/plain; charset=utf-8",
            "Content-Disposition": `attachment; filename="agentd-${output[1]}.txt"`,
          });
          res.end(value.text);
          return;
        }
        if (path === "/api/review-jobs" && req.method === "POST") {
          const input = await body(req);
          if (
            ![
              "start",
              "status",
              "file",
              "acknowledge",
              "page",
              "acknowledgePage",
              "cancel",
            ].includes(input.action)
          )
            throw Error("Unsupported review action");
          send(
            200,
            await call({
              op:
                input.action === "start"
                  ? "review-start"
                  : input.action === "status"
                    ? "review-job"
                    : input.action === "file"
                      ? "review-file"
                      : input.action === "acknowledge"
                        ? "review-file-acknowledge"
                        : input.action === "page"
                          ? "review-file-page"
                          : input.action === "acknowledgePage"
                            ? "review-file-page-acknowledge"
                            : "review-cancel",
              owner: accountOwner,
              ...(input.action === "start"
                ? { id: input.id }
                : {
                    job: input.job,
                    ...(["file", "acknowledge", "page", "acknowledgePage"].includes(
                      input.action,
                    )
                      ? {
                          tree: input.tree,
                          file: input.file,
                          ...(input.action === "acknowledge"
                            ? { fingerprint: input.fingerprint }
                            : {}),
                          ...(["page", "acknowledgePage"].includes(input.action)
                            ? { page: input.page }
                            : {}),
                          ...(input.action === "acknowledgePage"
                            ? {
                                pages: input.pages,
                                fileFingerprint: input.fileFingerprint,
                                pageFingerprint: input.pageFingerprint,
                              }
                            : {}),
                        }
                      : {}),
                  }),
            }),
          );
          return;
        }
        if (path === "/api/validation-jobs" && req.method === "POST") {
          const input = await body(req);
          if (!["start", "status", "cancel"].includes(input.action))
            throw Error("Unsupported validation action");
          send(
            200,
            await call({
              op:
                input.action === "start"
                  ? "validation-start"
                  : input.action === "status"
                    ? "validation-job"
                    : "validation-cancel",
              owner: accountOwner,
              ...(input.action === "start"
                ? { id: input.id, tree: input.tree }
                : { job: input.job }),
            }),
          );
          return;
        }
        if (path === "/api/commit-jobs" && req.method === "POST") {
          const input = await body(req);
          if (!["start", "status", "cancel"].includes(input.action))
            throw Error("Unsupported commit action");
          send(
            200,
            await call({
              op:
                input.action === "start"
                  ? "commit-start"
                  : input.action === "status"
                    ? "commit-job"
                    : "commit-cancel",
              owner: accountOwner,
              ...(input.action === "start"
                ? { id: input.id, tree: input.tree, message: input.message }
                : { job: input.job }),
            }),
          );
          return;
        }
        if (path === "/api/revision-jobs" && req.method === "POST") {
          const input = await body(req);
          if (!["start", "status", "cancel"].includes(input.action))
            throw Error("Unsupported revision action");
          send(
            200,
            await call({
              op:
                input.action === "start"
                  ? "revision-start"
                  : input.action === "status"
                    ? "revision-job"
                    : "revision-cancel",
              owner: accountOwner,
              ...(input.action === "start"
                ? {
                    id: input.id,
                    tree: input.tree,
                    prompt: input.prompt,
                    overrides: input.overrides,
                  }
                : { job: input.job }),
            }),
          );
          return;
        }
        if (path === "/api/restart-jobs" && req.method === "POST") {
          const input = await body(req);
          if (!["start", "status", "cancel"].includes(input.action))
            throw Error("Unsupported restart action");
          send(
            200,
            await call({
              op:
                input.action === "start"
                  ? "restart-start"
                  : input.action === "status"
                    ? "restart-job"
                    : "restart-cancel",
              owner: accountOwner,
              ...(input.action === "start" ? { id: input.id } : { job: input.job }),
            }),
          );
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
        const threads = path.match(/^\/api\/projects\/([0-9a-z-]+)\/conversations$/);
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
              "project-delete",
              "project-delete-cancel",
              "project-purge",
              "workspace-preferences",
              "workspace-preferences-save",
            ].includes(input.op)
          )
            throw new Error("Unsupported action");
          if (
            input.op === "approve" &&
            (typeof input.fingerprint !== "string" ||
              !/^[0-9a-f]{64}$/.test(input.fingerprint))
          )
            throw Error("Refresh the run preview before approving.");
          if (
            (input.op === "project-delete" && input.scope === "agentd_and_checkout") ||
            input.op === "workspace-preferences-save"
          ) {
            if (!accessKeyMatches(input.currentKey, accessHash))
              throw Error("Current access key did not match.");
          }
          const { currentKey: _stepUpKey, ...forward } = input;
          send(200, await call(forward));
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
          if (typeof value?.data !== "string") throw Error("Unexpected runner response");
          const body = Buffer.from(value.data, "base64");
          res.writeHead(200, {
            "Content-Type": value.ext === ".png" ? "image/png" : "image/jpeg",
          });
          res.end(body);
          return;
        }
        send(404, { error: "Not found" });
      } catch (error) {
        failResponse(res, send, error);
      }
    },
  );
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  server.listen(c.port, c.host);
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.umask(0o077);
  const config = JSON.parse(
    readFileSync(process.env.AGENTD_MOBILE_CONFIG ?? "/etc/agentd/mobile.json", "utf8"),
  );
  const server = mobile({
    socket: "/run/agentd/control.sock",
    attachments: "/srv/agentd/state/attachments",
    publicDir: "/opt/agentd/public",
    ...config,
  });
  server.on("listening", () =>
    console.log(JSON.stringify({ event: "mobile_listening", origin: config.origin })),
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
