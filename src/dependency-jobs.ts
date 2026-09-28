import { type DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  checkManifest,
  writeManifests,
  prepareDependencies,
  type DependencyPreparation,
} from "./check-setup.ts";
import { requireSpace, type Limits } from "./resources.ts";
import { operationSlot } from "./operation-slot.ts";

type Options = {
  db: DatabaseSync;
  stateDir: string;
  limits: Limits;
  project: (id: string) => any;
  task: (id: string) => any;
  blocked: () => boolean;
  settled: () => void;
  audit: (action: string, task: string | null, detail: any) => void;
  prepare?: DependencyPreparation;
};
export function dependencyJobs(options: Options) {
  const db = options.db,
    slot = operationSlot("dependencies");
  const checkTarget = (input: any) => {
    const p = options.project(input.project);
    if (p.archived) throw Error("Restore this project first.");
    const row = input.task ? options.task(input.task) : null;
    if (
      input.task &&
      (!row ||
        row.project !== p.id ||
        row.review !== "pending" ||
        !row.worktree ||
        ["running", "queued", "cancelling", "waiting_for_approval"].includes(
          String(row.status),
        ))
    )
      throw Error("Select a finished edit awaiting review in this project.");
    return { p, row, path: String(row?.worktree ?? p.repo) };
  };
  const setupView = (input: any) => {
    const target = checkTarget(input);
    let plan: any = null,
      error = null;
    try {
      const value = checkManifest(target.path);
      plan = {
        legacy:
          !target.p.check_manifest &&
          target.p.check_lock === value.lockHash &&
          !!target.p.check_dependencies &&
          existsSync(String(target.p.check_dependencies)),
        fingerprint: value.fingerprint,
        packages: value.count,
        scripts: value.scripts,
        ready:
          target.p.check_manifest === value.fingerprint &&
          !!target.p.check_dependencies &&
          existsSync(String(target.p.check_dependencies)),
      };
    } catch (e) {
      error =
        (e as NodeJS.ErrnoException).code === "ENOENT"
          ? "Add package.json, package-lock.json and a test script to configure npm checks."
          : (e as Error).message;
    }
    return {
      project: target.p.id,
      task: target.row?.id ?? null,
      plan,
      error,
      busy: slot.busy(),
      jobs: db
        .prepare(
          "SELECT * FROM dependency_jobs WHERE project=? ORDER BY rowid DESC LIMIT 10",
        )
        .all(String(target.p.id)),
    };
  };
  const startSetup = (input: any) => {
    requireSpace([options.stateDir], options.limits.reserveBytes);
    if (options.blocked())
      throw Error("Wait for current work before preparing dependencies.");
    slot.assertAvailable();
    const target = checkTarget(input),
      value = checkManifest(target.path);
    if (input.fingerprint !== value.fingerprint)
      throw Error("Dependency files changed. Review setup again.");
    const id = randomUUID(),
      stage = join(options.stateDir, "dependencies", id);
    writeManifests(stage, value);
    db.prepare("INSERT INTO dependency_jobs VALUES(?,?,?,?,?,?,?)").run(
      id,
      target.p.id,
      target.row?.id ?? null,
      value.fingerprint,
      "running",
      null,
      new Date().toISOString(),
    );
    options.audit("approve-dependencies", target.row ? String(target.row.id) : null, {
      project: target.p.id,
      fingerprint: value.fingerprint,
      packages: value.count,
    });
    slot.start(
      id,
      async (signal) => {
        try {
          if (signal.aborted) throw Error("Dependency preparation cancelled.");
          await (options.prepare ?? prepareDependencies)(stage, options.stateDir, signal);
          if (signal.aborted) throw Error("Dependency preparation cancelled.");
          if (checkManifest(checkTarget(input).path).fingerprint !== value.fingerprint)
            throw Error(
              "Dependency files changed. Previous setup was kept; review and prepare again.",
            );
          db.prepare(
            "UPDATE projects SET check_dependencies=?,check_lock=?,check_manifest=? WHERE id=?",
          ).run(
            join(stage, "node_modules"),
            value.lockHash,
            value.fingerprint,
            target.p.id,
          );
          db.prepare(
            "UPDATE dependency_jobs SET state='succeeded',updated=? WHERE id=?",
          ).run(new Date().toISOString(), id);
        } catch (e) {
          try {
            rmSync(stage, { recursive: true, force: true });
          } catch {}
          db.prepare(
            "UPDATE dependency_jobs SET state=?,error=?,updated=? WHERE id=?",
          ).run(
            signal.aborted ? "cancelled" : "failed",
            (e as Error).message,
            new Date().toISOString(),
            id,
          );
        }
      },
      options.settled,
    );
    return { id, state: "running" };
  };

  return {
    view: setupView,
    start: startSetup,
    busy: slot.busy,
    operation: slot.view,
    cancel(id: string) {
      if (!slot.cancel(id)) throw Error("Preparation not found.");
      return { ok: true };
    },
    close: slot.close,
  };
}
