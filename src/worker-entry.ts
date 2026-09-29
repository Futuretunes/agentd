import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cursorCredentialPath, cursorCredentials } from "./cursor-policy.ts";
import { readCredentials } from "./credentials.ts";
import { homedir } from "node:os";
import { createServer, createConnection, type Socket } from "node:net";
import { spawn } from "node:child_process";
const [socket, command, ...args] = process.argv.slice(2);
const connections = new Set<Socket>();
// Wait for the independently started broker; fail closed if it never becomes ready.
await new Promise<void>((resolve, reject) => {
  const deadline = Date.now() + 5000;
  const probe = () => {
    const peer = createConnection(socket);
    peer.once("connect", () => {
      peer.destroy();
      resolve();
    });
    peer.once("error", () => {
      peer.destroy();
      if (Date.now() >= deadline) reject(Error("Provider proxy unavailable"));
      else setTimeout(probe, 50);
    });
  };
  probe();
});
const server = createServer((client) => {
  if (connections.size >= 32) {
    client.destroy();
    return;
  }
  const upstream = createConnection(socket);
  connections.add(client);
  connections.add(upstream);
  client.on("error", () => upstream.destroy());
  upstream.on("error", () => client.destroy());
  client.on("close", () => {
    connections.delete(client);
    upstream.destroy();
  });
  upstream.on("close", () => {
    connections.delete(upstream);
    client.destroy();
  });
  client.setTimeout(180000, () => client.destroy());
  upstream.setTimeout(180000, () => upstream.destroy());
  client.pipe(upstream);
  upstream.pipe(client);
});
server.on("error", () => process.exit(1));
server.listen(0, "127.0.0.1", () => {
  const address = server.address();
  if (!address || typeof address === "string") throw Error("Proxy did not start");
  const proxy = `http://127.0.0.1:${address.port}`;
  const env = {
    ...process.env,
    HTTP_PROXY: proxy,
    HTTPS_PROXY: proxy,
    ALL_PROXY: proxy,
    http_proxy: proxy,
    https_proxy: proxy,
    all_proxy: proxy,
    NO_PROXY: "",
    no_proxy: "",
    NODE_USE_ENV_PROXY: "1",
    DISABLE_AUTOUPDATER: "1",
    DISABLE_TELEMETRY: "1",
    DISABLE_ERROR_REPORTING: "1",
  };
  if (process.env.AGENTD_ACCESS_ONLY === "claude")
    (env as NodeJS.ProcessEnv).CLAUDE_CODE_OAUTH_TOKEN = readCredentials(
      homedir(),
      "claude",
    ).claudeAiOauth.accessToken;
  if (process.env.AGENTD_ACCESS_ONLY === "cursor")
    (env as NodeJS.ProcessEnv).CURSOR_AUTH_TOKEN = cursorCredentials(
      JSON.parse(readFileSync(join(homedir(), cursorCredentialPath), "utf8")),
      false,
    ).accessToken;
  const child = spawn(command, args, { env, stdio: "inherit" });
  const stop = () => {
    child.kill("SIGTERM");
    setTimeout(() => child.kill("SIGKILL"), 2000).unref();
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  child.on("error", () => {
    server.close();
    process.exitCode = 1;
  });
  child.on("close", (code) => {
    for (const peer of connections) peer.destroy();
    server.close();
    process.exitCode = code ?? 1;
  });
});
