import { type DatabaseSync } from "node:sqlite";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawn, type ChildProcess } from "node:child_process";
import { checkManifest } from "./check-setup.ts";
import { snapshot, checkSnapshot } from "./changes.ts";
import { isolated } from "./isolation.ts";
import { captureOutput, monitorWorktree, type Limits } from "./resources.ts";
export type CheckExecution = {
  id: string;
  child: ChildProcess;
  done: Promise<void>;
  stop: (reason?: string) => void;
};
type Options = {
  db: DatabaseSync;
  stateDir: string;
  worktrees: string;
  logs: string;
  limits: Limits;
  isolate?: typeof isolated;
  settled: (owner: CheckExecution) => void;
};
/** Called only after runner approval/admission checks; shares the task worker slot. */
export function executeChecks(
  c: Options,
  row: any,
  p: any,
  expected: string,
): CheckExecution {
  const { db, limits } = c;
  const prepared = checkSnapshot(
    String(row.worktree),
    String(row.revision),
    expected,
    c.stateDir,
  );
  let sandbox: ReturnType<typeof isolated> | undefined;
  const log = join(c.logs, String(row.id) + ".checks.log");
  let child: ChildProcess;
  let recorded = false;
  try {
    if (
      p.check_manifest &&
      checkManifest(prepared.worktree).fingerprint !== p.check_manifest
    )
      throw Error("Dependency files changed. Open Set up checks for this review.");
    const hash = createHash("sha256")
      .update(readFileSync(join(prepared.worktree, "package-lock.json")))
      .digest("hex");
    if (hash !== p.check_lock)
      throw Error("Dependencies changed. Open Set up checks for this review.");
    sandbox = (c.isolate ?? isolated)(
      prepared.worktree,
      c.stateDir,
      process.execPath,
      [fileURLToPath(new URL("./check-worker.ts", import.meta.url))],
      undefined,
      String(p.check_dependencies),
    );
    db.prepare("UPDATE tasks SET checks=? WHERE id=?").run(
      JSON.stringify({ status: "running", tree: expected, log, input: "git-tree-v1" }),
      row.id,
    );
    recorded = true;
    child = spawn(sandbox.command, sandbox.args, {
      cwd: prepared.worktree,
      env: { PATH: process.env.PATH, HOME: homedir(), LANG: "C.UTF-8", TERM: "dumb" },
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    try {
      if (recorded)
        db.prepare("UPDATE tasks SET checks=? WHERE id=?").run(
          JSON.stringify({
            status: "failed",
            tree: expected,
            log,
            input: "git-tree-v1",
            error: (error as Error).message,
          }),
          row.id,
        );
    } finally {
      try {
        sandbox?.cleanup();
      } finally {
        prepared.cleanup();
      }
    }
    throw error;
  }
  let stopped: string | null = null,
    spawnError = "";
  let unmonitor = () => {};
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => (resolveDone = resolve));
  const kill = () => {
    if (child.pid)
      try {
        process.kill(-child.pid, "SIGKILL");
      } catch {}
  };
  const stop = (reason = "cancelled") => {
    stopped = reason;
    kill();
  };
  const timer = setTimeout(() => stop("timed_out"), 240000);
  const handle = { id: String(row.id), child, done, stop };
  child.on("error", (error) => (spawnError = error.message));
  child.on("close", (code) => {
    unmonitor();
    clearTimeout(timer);
    kill();
    let cleanupError = false;
    try {
      sandbox!.cleanup();
    } catch {
      cleanupError = true;
    }
    try {
      prepared.cleanup();
    } catch {
      cleanupError = true;
    }
    let status =
      stopped ?? (code === 0 && !spawnError && !cleanupError ? "passed" : "failed");
    try {
      if (
        snapshot(String(row.worktree), String(row.revision), c.stateDir).tree !== expected
      )
        status = "stale";
    } catch {
      status = "stale";
    }
    db.prepare("UPDATE tasks SET checks=? WHERE id=?").run(
      JSON.stringify({
        status,
        tree: expected,
        log,
        input: "git-tree-v1",
        exitCode: code,
        error: spawnError || null,
        at: new Date().toISOString(),
      }),
      row.id,
    );
    resolveDone();
    c.settled(handle);
  });
  const fail = (message: string) => {
    spawnError = message;
    stop("failed");
  };
  try {
    captureOutput(child, log, fail, limits.logBytes);
    unmonitor = monitorWorktree(
      prepared.worktree,
      [c.stateDir, c.worktrees, c.logs],
      fail,
      limits,
    );
  } catch {
    fail("Could not safely write task output");
  }
  return handle;
}
