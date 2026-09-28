import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { type Limits } from "./resources.ts";

export type Checkout = {
  repo: string;
  tree: string;
  revision: string;
  seed: string | null;
  limits: Limits;
};
/** Trusted local Git preparation, never a model/tool execution entry point. */
export function prepareWorktree(input: Checkout, signal: AbortSignal): Promise<void> {
  if (signal.aborted) return Promise.reject(Error("Worktree preparation stopped."));
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL("./worktree-preparation-worker.ts", import.meta.url))],
      {
        env: {
          PATH: "/usr/local/bin:/usr/bin:/bin",
          HOME: "/nonexistent",
          LANG: "C.UTF-8",
        },
        detached: true,
        stdio: ["pipe", "pipe", "ignore"],
      },
    );
    let output = "",
      failure: Error | undefined;
    const kill = () => {
      if (child.pid)
        try {
          process.kill(-child.pid, "SIGKILL");
        } catch (e) {
          if ((e as NodeJS.ErrnoException).code !== "ESRCH")
            failure = Error("Could not stop worktree preparation.");
        }
    };
    const stop = () => {
      failure = Error("Worktree preparation stopped.");
      kill();
    };
    signal.addEventListener("abort", stop, { once: true });
    const timer = setTimeout(() => {
      failure = Error("Worktree preparation timed out.");
      kill();
    }, 60000);
    child.on("error", () => {
      failure = Error("Could not start worktree preparation.");
    });
    child.stdin.on("error", () => {});
    child.stdout.on("data", (chunk) => {
      if (Buffer.byteLength(output) + chunk.length > 4096) {
        failure = Error("Invalid worktree preparation response.");
        kill();
        return;
      }
      output += chunk.toString();
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      signal.removeEventListener("abort", stop);
      kill();
      if (failure) return reject(failure);
      try {
        const result = JSON.parse(output);
        if (code !== 0 || result.ok !== true)
          throw Error(
            typeof result.error === "string"
              ? result.error
              : "Worktree preparation failed.",
          );
        resolve();
      } catch (e) {
        reject(
          e instanceof SyntaxError ? Error("Invalid worktree preparation response.") : e,
        );
      }
    });
    child.stdin.end(JSON.stringify(input));
    if (signal.aborted) stop();
  });
}
