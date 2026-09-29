import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { type DatabaseSync } from "node:sqlite";
import { prepareWorktree } from "./worktree-preparation.ts";
import { followupContext, contextPrompt } from "./followup-context.ts";
import { invocation, verifySelectionVersion, type Mode } from "./adapters.ts";
import { isolated } from "./isolation.ts";
import {
  requireSpace,
  captureOutput,
  monitorWorktree,
  type Limits,
} from "./resources.ts";
export type TaskExecution = {
  id: string;
  child?: ChildProcess;
  done: Promise<void>;
  stop: (status: string) => void;
};
type Options = {
  db: DatabaseSync;
  stateDir: string;
  worktrees: string;
  logs: string;
  limits: Limits;
  strictWorkers?: boolean;
  credentialRenewal?: boolean;
  command?: (adapter: string, prompt: string, mode?: string) => [string, string[]];
  prepareWorktree?: typeof prepareWorktree;
  isolate?: typeof isolated;
  project: (id: string) => any;
  get: (id: string) => any;
  attachment: (id: string) => any;
  attachmentRoot: string;
  requireAdapter: (adapter: string, mode: string) => void;
  transition: (id: string, status: string, error?: string | null) => void;
  closing: () => boolean;
  settled: (owner: TaskExecution) => void;
};
/** Approval and renewal precede admission; one owner spans checkout and execution. */
export function executeTask(c: Options, row: any): TaskExecution {
  const {
    db,
    limits,
    project,
    get,
    attachment,
    attachmentRoot,
    requireAdapter,
    transition,
  } = c;
  const approved = JSON.parse(String(row.execution));
  const id = String(row.id),
    tree = join(c.worktrees, id),
    log = join(c.logs, `${id}.log`);
  transition(id, "running");
  let cleanup = () => {};
  const checkoutAbort = new AbortController();
  let checkoutReason: string | undefined;
  let resolveDone!: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });
  const owner: TaskExecution = {
    id,
    done,
    stop: (status) => {
      if (checkoutReason) return;
      checkoutReason = status;
      transition(id, "cancelling");
      checkoutAbort.abort();
    },
  };
  const run = async () => {
    try {
      if (checkoutAbort.signal.aborted || c.closing())
        throw Error("Worktree preparation stopped.");
      requireSpace([c.stateDir, c.worktrees, c.logs], limits.reserveBytes);
      requireAdapter(String(row.adapter), String(row.mode));
      if (
        !c.command &&
        (approved.selection.model !== "provider" ||
          approved.selection.effort !== "provider")
      )
        verifySelectionVersion(String(row.adapter));
      const repo = String(project(String(row.project)).repo);
      // Persist the path first so interrupted/partial preparation is recoverable.
      db.prepare("UPDATE tasks SET worktree=?,log=? WHERE id=?").run(tree, log, id);
      await (c.prepareWorktree ?? prepareWorktree)(
        {
          repo,
          tree,
          revision: String(row.revision),
          seed: row.seed_tree ? String(row.seed_tree) : null,
          limits,
        },
        checkoutAbort.signal,
      );
      if (checkoutAbort.signal.aborted || c.closing())
        throw Error("Worktree preparation stopped.");
      requireAdapter(String(row.adapter), String(row.mode));
      let prompt = String(row.prompt);
      const pictures: string[] = [];
      const attachments = JSON.parse(String(row.attachments));
      if (attachments.length) {
        const folder = join(tree, ".agentd-input");
        mkdirSync(folder, { mode: 0o700 });
        for (const id of attachments) {
          const meta = attachment(id);
          const target = join(folder, id + meta.ext);
          copyFileSync(join(attachmentRoot, id + meta.ext), target);
          pictures.push(target);
        }
        prompt +=
          "\nUser attached images (use your image-reading tool):\n" + pictures.join("\n");
      }
      const context = followupContext(
        row.parent ? get(String(row.parent)) : null,
        approved.settings.context,
      );
      if (context.summary.sha256 !== approved.context.sha256)
        throw Error("Previous answer changed. Review and approve this run again.");
      prompt = contextPrompt(prompt, context);
      if (row.mode === "edit")
        prompt +=
          "\nEdit files in this worktree only. Do not commit, push or open pull requests. The user will review changes and run checks separately.";
      let [command, args] = c.command
        ? c.command(String(row.adapter), prompt, String(row.mode))
        : invocation(String(row.adapter), {
            prompt,
            mode: row.mode as Mode,
            images: pictures,
            selection: approved.selection,
          });
      if (row.mode === "edit" || row.mode === "chat" || c.strictWorkers) {
        const sandbox = (c.isolate ?? isolated)(
          tree,
          c.stateDir,
          command,
          args,
          String(row.adapter),
          undefined,
          row.mode === "edit",
          row.mode === "chat",
          c.credentialRenewal ? { accessOnly: true } : undefined,
        );
        command = sandbox.command;
        args = sandbox.args;
        cleanup = sandbox.cleanup;
      }
      const env: NodeJS.ProcessEnv = {
        PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin",
        HOME: process.env.HOME,
        LANG: "C.UTF-8",
        TERM: "dumb",
      };
      const child = spawn(command, args, {
        cwd: tree,
        env,
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
      let resourceError: string | undefined;
      let unmonitor = () => {};
      let reason: string | undefined,
        killTimer: ReturnType<typeof setTimeout> | undefined;
      const kill = (signal: NodeJS.Signals) => {
        if (child.pid)
          try {
            process.kill(-child.pid, signal);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
          }
      };
      const stop = (status: string) => {
        if (reason) return;
        reason = status;
        transition(id, "cancelling");
        kill("SIGTERM");
        killTimer = setTimeout(() => kill("SIGKILL"), 2000);
      };
      const timer = setTimeout(() => stop("timed_out"), approved.timeoutMs);
      owner.child = child;
      owner.stop = stop;
      let spawnError: string | undefined;
      child.on("error", (error) => {
        spawnError = error.message;
      });
      child.on("close", (code) => {
        unmonitor();
        clearTimeout(timer);
        if (killTimer) clearTimeout(killTimer);
        // Reap any descendants before another task may start.
        kill("SIGKILL");
        cleanup();
        if (row.mode === "edit")
          db.prepare("UPDATE tasks SET review=? WHERE id=?").run("pending", id);
        transition(
          id,
          reason ?? (code === 0 && !spawnError ? "succeeded" : "failed"),
          resourceError ?? spawnError ?? (code === 0 ? null : `Exit ${code}`),
        );
        resolveDone();
        c.settled(owner);
      });
      const fail = (message: string) => {
        resourceError = message;
        stop("failed");
      };
      try {
        captureOutput(child, log, fail, limits.logBytes, true);
        unmonitor = monitorWorktree(
          tree,
          [c.stateDir, c.worktrees, c.logs],
          fail,
          limits,
        );
      } catch {
        fail("Could not safely write task output");
      }
    } catch (error) {
      cleanup();
      if (row.mode === "edit" && existsSync(tree))
        db.prepare("UPDATE tasks SET review='pending' WHERE id=?").run(id);
      transition(
        id,
        checkoutReason ?? "failed",
        checkoutReason ? null : (error as Error).message,
      );
      resolveDone();
      c.settled(owner);
    }
  };
  void Promise.resolve().then(run);
  return owner;
}
