import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";

export type ReviewInput = {
  worktree: string;
  revision: string;
  stateDir: string;
  mergeParent: string | null;
  conflictPaths: string[];
};
/** Trusted local Git preparation, never a model/tool execution entry point. */
export function prepareReview(input: ReviewInput, signal: AbortSignal): Promise<any> {
  if (signal.aborted) return Promise.reject(Error("Review preparation stopped."));
  const temporary = mkdtempSync(join(input.stateDir, "preview-job-"));
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [fileURLToPath(new URL("./review-preview-worker.ts", import.meta.url))],
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
            failure = Error("Could not stop review preparation.");
        }
    };
    const stop = () => {
      failure = Error("Review preparation stopped.");
      kill();
    };
    signal.addEventListener("abort", stop, { once: true });
    const timer = setTimeout(() => {
      failure = Error("Review preparation timed out.");
      kill();
    }, 60000);
    child.on("error", () => {
      failure = Error("Could not start review preparation.");
    });
    child.stdin.on("error", () => {});
    child.stdout.on("data", (chunk) => {
      if (Buffer.byteLength(output) + chunk.length > 2_000_000) {
        failure = Error("Invalid review preparation response.");
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
              : "Review preparation failed.",
          );
        resolve(result.value);
      } catch (e) {
        reject(
          e instanceof SyntaxError ? Error("Invalid review preparation response.") : e,
        );
      }
    });
    child.stdin.end(JSON.stringify({ ...input, stateDir: temporary }));
    if (signal.aborted) stop();
  }).finally(() => rmSync(temporary, { recursive: true, force: true }));
}
