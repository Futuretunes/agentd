import { createHash } from "node:crypto";
import {
  constants,
  existsSync,
  lstatSync,
  openSync,
  closeSync,
  writeSync,
  fstatSync,
  realpathSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { gitOutput } from "./git-policy.ts";
import { inventory } from "./resources.ts";
import type { DatabaseSync } from "node:sqlite";
const ageMs = 30 * 86400000;
const marker =
  "[Raw execution output removed by approved storage cleanup. The saved answer and task history are retained.]\n";
export function retention(
  db: DatabaseSync,
  roots: { worktrees: string; logs: string },
  audit: (action: string, task: string | null, detail?: unknown) => unknown,
) {
  const plans = new Map<string, { fingerprint: string; expires: number }>();
  const git = gitOutput;
  function candidates(now: number) {
    return db
      .prepare(
        `SELECT t.*,c.archived,p.repo FROM tasks t JOIN conversations c ON t.conversation=c.id JOIN projects p ON t.project=p.id
   WHERE c.archived=1 AND t.updated<? AND (t.status='succeeded' AND t.mode IN ('ask','chat') OR t.review='discarded' AND t.status IN ('succeeded','failed','cancelled','timed_out','interrupted'))
   AND NOT EXISTS(SELECT 1 FROM tasks sibling WHERE sibling.conversation=t.conversation AND (sibling.status IN ('waiting_for_approval','queued','running','cancelling') OR sibling.review='pending'))
   AND NOT EXISTS(SELECT 1 FROM audit a WHERE a.task=t.id AND a.action='cleanup-complete')
   ORDER BY t.updated,t.id LIMIT 20`,
      )
      .all(new Date(now - ageMs).toISOString()) as any[];
  }
  function describe(row: any) {
    if (!/^[a-f0-9-]{36}$/.test(row.id)) throw Error("Invalid task storage identifier");
    const item: any = {
      id: row.id,
      conversation: row.conversation,
      updated: row.updated,
      worktree: null,
      logs: [],
      bytes: 0,
    };
    const root = realpathSync(roots.worktrees),
      logs = realpathSync(roots.logs);
    if (row.worktree) {
      const expected = join(root, row.id);
      if (resolve(row.worktree) !== expected)
        throw Error("Worktree is not available for safe cleanup");
      let s;
      try {
        s = lstatSync(expected);
      } catch (error: any) {
        if (error.code !== "ENOENT") throw error;
      }
      const registered = git(row.repo, ["worktree", "list", "--porcelain"])
        .split("\n")
        .includes("worktree " + expected);
      if (!s) {
        // A fresh approval may reconcile an interrupted removal, never replay it.
        const started = db
          .prepare("SELECT 1 FROM audit WHERE task=? AND action='cleanup-start' LIMIT 1")
          .get(row.id);
        if (registered || !started)
          throw Error("Worktree is not available for safe cleanup");
        item.worktree = { path: expected, missing: true };
      } else {
        if (!s.isDirectory() || s.isSymbolicLink())
          throw Error("Linked worktree refused");
        if (!registered) throw Error("Worktree registration mismatch");
        // Read-only tasks should have no edits. Discarded edits require explicit cleanup approval.
        if (
          row.review !== "discarded" &&
          git(expected, [
            "status",
            "--porcelain",
            "--untracked-files=all",
            "--ignored",
          ]).trim()
        )
          throw Error("Unexpected files or changes are preserved");
        const size = inventory(expected);
        item.worktree = { path: expected, ...size };
        item.bytes += size.bytes;
      }
    }
    for (const suffix of [".log", ".checks.log"]) {
      const path = join(logs, row.id + suffix);
      if (!existsSync(path)) continue;
      if (suffix === ".log") {
        const answer = path + ".answer";
        if (!existsSync(answer)) continue;
        const saved = lstatSync(answer);
        if (!saved.isFile() || saved.isSymbolicLink() || saved.nlink !== 1)
          throw Error("Saved answer requires manual review");
      }
      if (suffix === ".log" && row.log !== path) throw Error("Log path mismatch");
      const s = lstatSync(path);
      if (!s.isFile() || s.isSymbolicLink() || s.nlink !== 1)
        throw Error("Linked log refused");
      if (s.size <= Buffer.byteLength(marker)) continue;
      item.logs.push({
        path,
        dev: s.dev,
        ino: s.ino,
        size: s.size,
        mtime: s.mtimeMs,
        ctime: s.ctimeMs,
      });
      item.bytes += s.size - Buffer.byteLength(marker);
    }
    return item;
  }
  function snapshot(now = Date.now()) {
    const items: any[] = [],
      skipped: any[] = [];
    for (const row of candidates(now)) {
      try {
        const item = describe(row);
        if (item.worktree || item.logs.length) items.push(item);
      } catch {
        skipped.push({
          id: row.id,
          reason: "Kept: storage requires manual review",
        });
      }
    }
    const fingerprint = createHash("sha256").update(JSON.stringify(items)).digest("hex");
    return {
      items,
      skipped,
      fingerprint,
      bytes: items.reduce((n, x) => n + x.bytes, 0),
    };
  }
  function preview(owner: string) {
    const value = snapshot();
    plans.set(owner, {
      fingerprint: value.fingerprint,
      expires: Date.now() + 600000,
    });
    if (plans.size > 100) plans.delete(plans.keys().next().value!);
    return {
      fingerprint: value.fingerprint,
      bytes: value.bytes,
      items: value.items.map((x) => ({
        id: x.id,
        conversation: x.conversation,
        worktree: !!x.worktree && !x.worktree.missing,
        reconcileWorktree: !!x.worktree?.missing,
        logs: x.logs.length,
        bytes: x.bytes,
      })),
      skipped: value.skipped,
      minimumAgeDays: 30,
      expires: Date.now() + 600000,
    };
  }
  function apply(owner: string, fingerprint: string) {
    const plan = plans.get(owner);
    if (!plan || plan.expires < Date.now() || plan.fingerprint !== fingerprint)
      throw Error("Cleanup preview expired. Review storage again.");
    const current = snapshot();
    if (current.fingerprint !== fingerprint)
      throw Error("Storage changed. Review a fresh cleanup preview.");
    plans.delete(owner);
    const removed: string[] = [],
      errors: string[] = [];
    for (const item of current.items) {
      try {
        audit("cleanup-start", item.id, { fingerprint });
        const row = db
          .prepare(
            "SELECT t.*,p.repo FROM tasks t JOIN projects p ON p.id=t.project WHERE t.id=?",
          )
          .get(item.id) as any;
        if (JSON.stringify(describe(row)) !== JSON.stringify(item))
          throw Error("Storage changed. Review a fresh cleanup preview.");
        if (item.worktree) {
          if (!item.worktree.missing)
            git(row.repo, [
              "worktree",
              "remove",
              ...(row.review === "discarded" ? ["--force"] : []),
              item.worktree.path,
            ]);
          db.prepare("UPDATE tasks SET worktree=NULL WHERE id=?").run(item.id);
        }
        for (const log of item.logs) {
          const fd = openSync(
            log.path,
            constants.O_WRONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
          );
          try {
            const s = fstatSync(fd);
            if (
              !s.isFile() ||
              s.mtimeMs !== log.mtime ||
              s.ctimeMs !== log.ctime ||
              s.dev !== log.dev ||
              s.ino !== log.ino ||
              s.nlink !== 1 ||
              s.size !== log.size
            )
              throw Error("Log changed");
            writeSync(fd, marker);
            importTruncate(fd, Buffer.byteLength(marker));
          } finally {
            closeSync(fd);
          }
        }
        audit("cleanup-complete", item.id, { fingerprint });
        removed.push(item.id);
      } catch {
        audit("cleanup-incomplete", item.id, { fingerprint });
        errors.push(item.id);
      }
    }
    return { removed, errors };
  }
  return { preview, apply };
}
import { ftruncateSync as importTruncate } from "node:fs";
