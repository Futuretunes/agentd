import {
  existsSync,
  lstatSync,
  realpathSync,
  rmSync,
  unlinkSync,
} from "node:fs";
import { join, resolve } from "node:path";
import type { DatabaseSync } from "node:sqlite";

export type DeleteScope = "agentd" | "agentd_and_checkout";

export function isManagedProjectCheckout(
  repo: string,
  projectsDir: string,
  projectId: string,
): boolean {
  if (!/^[a-f0-9-]{36}$/.test(projectId)) return false;
  let root: string;
  try {
    root = realpathSync(projectsDir);
  } catch {
    return false;
  }
  const expected = join(root, projectId);
  let actual: string;
  try {
    const st = lstatSync(repo);
    if (st.isSymbolicLink()) return false;
    actual = realpathSync(repo);
  } catch {
    return false;
  }
  return actual === expected || resolve(repo) === expected;
}

export function removeManagedCheckout(
  repo: string,
  projectsDir: string,
  projectId: string,
) {
  if (!isManagedProjectCheckout(repo, projectsDir, projectId))
    throw Error("Checkout is outside AgentD-managed project roots and was not removed.");
  const target = realpathSync(repo);
  const root = realpathSync(projectsDir);
  if (!target.startsWith(root + "/") && target !== root)
    throw Error("Checkout path refused");
  rmSync(target, { recursive: true, force: false });
}

export function purgeProjectRecords(
  db: DatabaseSync,
  projectId: string,
  roots: { worktrees: string; logs: string; attachments: string },
) {
  const tasks = db
    .prepare("SELECT id, worktree, log, attachments FROM tasks WHERE project=?")
    .all(projectId) as Array<{
    id: string;
    worktree: string | null;
    log: string | null;
    attachments: string;
  }>;
  const worktreeRoot = realpathSync(roots.worktrees);
  const logRoot = realpathSync(roots.logs);
  const attachmentRoot = realpathSync(roots.attachments);
  for (const task of tasks) {
    if (task.worktree) {
      const expected = join(worktreeRoot, task.id);
      try {
        const st = lstatSync(expected);
        if (!st.isSymbolicLink() && realpathSync(expected) === expected)
          rmSync(expected, { recursive: true, force: true });
      } catch {
        /* missing is fine */
      }
    }
    for (const path of [
      task.log,
      task.log ? task.log + ".answer" : null,
      join(logRoot, task.id + ".log"),
      join(logRoot, task.id + ".log.answer"),
      join(logRoot, task.id + ".checks.log"),
    ].filter(Boolean) as string[]) {
      try {
        const st = lstatSync(path);
        if (st.isFile() && !st.isSymbolicLink()) unlinkSync(path);
      } catch {
        /* missing is fine */
      }
    }
    let ids: string[] = [];
    try {
      ids = JSON.parse(String(task.attachments || "[]"));
    } catch {
      ids = [];
    }
    for (const id of ids) {
      if (typeof id !== "string" || !/^[a-f0-9-]{36}$/.test(id)) continue;
      const path = join(attachmentRoot, id);
      try {
        const st = lstatSync(path);
        if (st.isFile() && !st.isSymbolicLink()) unlinkSync(path);
      } catch {
        /* missing is fine */
      }
    }
  }
  const conversations = db
    .prepare("SELECT id FROM conversations WHERE project=?")
    .all(projectId) as Array<{ id: string }>;
  for (const row of conversations) {
    db.prepare(
      "DELETE FROM execution_settings WHERE scope='conversation' AND scope_id=?",
    ).run(row.id);
  }
  db.prepare(
    "DELETE FROM execution_settings WHERE scope='project' AND scope_id=?",
  ).run(projectId);
  db.prepare(
    "DELETE FROM review_jobs WHERE task IN (SELECT id FROM tasks WHERE project=?)",
  ).run(projectId);
  db.prepare(
    "DELETE FROM publications WHERE task IN (SELECT id FROM tasks WHERE project=?)",
  ).run(projectId);
  db.prepare(
    "DELETE FROM events WHERE task IN (SELECT id FROM tasks WHERE project=?)",
  ).run(projectId);
  db.prepare("DELETE FROM dependency_jobs WHERE project=?").run(projectId);
  db.prepare("DELETE FROM repository_jobs WHERE project=?").run(projectId);
  db.prepare("DELETE FROM tasks WHERE project=?").run(projectId);
  db.prepare("DELETE FROM conversations WHERE project=?").run(projectId);
  db.prepare("DELETE FROM projects WHERE id=?").run(projectId);
}

export function dueDeletedProjects(db: DatabaseSync, now = new Date()) {
  return db
    .prepare(
      "SELECT * FROM projects WHERE deleted_at IS NOT NULL AND purge_after IS NOT NULL AND purge_after<=? ORDER BY purge_after,id LIMIT 10",
    )
    .all(now.toISOString()) as Array<Record<string, unknown>>;
}

export function assertPathExistsOrMissing(path: string) {
  return existsSync(path);
}
