import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { adapter } from "./adapters.ts";
import { isolated } from "./isolation.ts";
import { normalizeCodexUsage, usageResponse } from "./provider-usage.ts";
/** No repository mounted, provider-only egress, disposable access-only credentials. */
export async function probeUsage(stateDir: string, signal: AbortSignal) {
  if (signal.aborted) throw Error("Usage cancelled");
  const empty = mkdtempSync(join(stateDir, "usage-"));
  let sandbox: ReturnType<typeof isolated> | undefined;
  try {
    sandbox = isolated(
      empty,
      stateDir,
      process.execPath,
      [
        fileURLToPath(new URL("./native-usage.ts", import.meta.url)),
        adapter("codex").executable(),
      ],
      "codex",
      undefined,
      false,
      true,
      { accessOnly: true },
    );
    const raw = await new Promise<any>((resolve, reject) => {
      const child = spawn(sandbox!.command, sandbox!.args, {
        cwd: empty,
        env: {
          PATH: process.env.PATH,
          HOME: process.env.HOME,
          LANG: "C.UTF-8",
          TERM: "dumb",
        },
        stdio: ["ignore", "pipe", "ignore"],
        detached: true,
      });
      let output = "",
        bytes = 0,
        failed = false;
      const kill = () => {
        failed = true;
        if (child.pid)
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {}
      };
      const timer = setTimeout(kill, 25000);
      signal.addEventListener("abort", kill, { once: true });
      child.on("error", kill);
      child.stdout.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > 65536) kill();
        else output += chunk.toString();
      });
      child.on("close", (code) => {
        clearTimeout(timer);
        signal.removeEventListener("abort", kill);
        try {
          if (failed || code !== 0) throw Error();
          resolve(usageResponse(normalizeCodexUsage(JSON.parse(output))));
        } catch {
          reject(Error("Usage unavailable"));
        }
      });
      if (signal.aborted) kill();
    });
    return raw;
  } finally {
    try {
      sandbox?.cleanup();
    } finally {
      rmSync(empty, { recursive: true, force: true });
    }
  }
}
