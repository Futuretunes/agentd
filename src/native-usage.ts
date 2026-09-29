import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { testedVersions } from "./native-policy.ts";
import { normalizeCodexUsage, usageResponse } from "./provider-usage.ts";
const exec = promisify(execFile);
// Fixed read-only RPC sequence. No thread, turn, consent, reset or purchase methods.
export async function readNativeUsage(executable: string, signal: AbortSignal) {
  const version = await exec(executable, ["--version"], {
    signal,
    timeout: 5000,
    maxBuffer: 4096,
  });
  if (version.stdout.trim() !== testedVersions.codex)
    throw Error("Unsupported usage CLI");
  if (signal.aborted) throw Error("Usage cancelled");
  return new Promise<any>((resolve, reject) => {
    const child = spawn(
      executable,
      [
        "--strict-config",
        "-c",
        'forced_login_method="chatgpt"',
        "-c",
        'cli_auth_credentials_store="file"',
        "-c",
        'model_provider="openai"',
        "app-server",
      ],
      { stdio: ["pipe", "pipe", "ignore"] },
    );
    let buffer = "",
      size = 0,
      result: any,
      failed = false,
      stopping = false,
      phase = 1;
    const stop = (bad = true) => {
      failed ||= bad;
      stopping = true;
      child.kill("SIGKILL");
    };
    const abort = () => stop();
    const timer = setTimeout(abort, 15000);
    signal.addEventListener("abort", abort, { once: true });
    child.on("error", abort);
    child.stdin.on("error", abort);
    const send = (v: unknown) => child.stdin.write(JSON.stringify(v) + "\n");
    child.on("close", () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      if (!failed && result) resolve(result);
      else reject(Error("Native usage unavailable"));
    });
    child.stdout.on("data", (chunk) => {
      if (stopping) return;
      size += chunk.length;
      if (size > 65536) return stop();
      buffer += chunk.toString();
      while (buffer.includes("\n") && !stopping) {
        const i = buffer.indexOf("\n"),
          line = buffer.slice(0, i);
        buffer = buffer.slice(i + 1);
        try {
          const m = JSON.parse(line);
          if (m.method && m.id !== undefined) throw Error();
          if (m.id === undefined) continue;
          if (m.id !== phase || m.error) throw Error();
          if (phase === 1) {
            phase = 2;
            send({ method: "initialized" });
            send({ id: 2, method: "account/read", params: { refreshToken: false } });
          } else if (phase === 2) {
            if (m.result?.account?.type !== "chatgpt") throw Error();
            phase = 3;
            send({ id: 3, method: "account/rateLimits/read" });
          } else {
            normalizeCodexUsage(m.result);
            result = m.result;
            stop(false);
          }
        } catch {
          stop();
        }
      }
    });
    if (signal.aborted) stop();
    else
      send({
        id: 1,
        method: "initialize",
        params: {
          clientInfo: { name: "agentd-usage", version: "1.0.0" },
          capabilities: { experimentalApi: false },
        },
      });
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const result = await readNativeUsage(process.argv[2], new AbortController().signal);
    process.stdout.write(
      JSON.stringify(usageResponse(normalizeCodexUsage(result))) + "\n",
    );
  } catch {
    process.exitCode = 1;
  }
}
