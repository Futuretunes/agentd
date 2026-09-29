import { type DatabaseSync } from "node:sqlite";
import { lstatSync, realpathSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";

export function publishDependencies(
  db: DatabaseSync,
  value: { project: string; job: string; path: string; lock: string; manifest: string },
) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const project = db
      .prepare(
        "UPDATE projects SET check_dependencies=?,check_lock=?,check_manifest=? WHERE id=?",
      )
      .run(value.path, value.lock, value.manifest, value.project);
    if (project.changes !== 1)
      throw Error("Dependency project changed before publication.");
    const job = db
      .prepare(
        "UPDATE dependency_jobs SET state='succeeded',updated=? WHERE id=? AND project=? AND state='running' AND fingerprint=?",
      )
      .run(new Date().toISOString(), value.job, value.project, value.manifest);
    if (job.changes !== 1)
      throw Error("Dependency preparation changed before publication.");
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
const overlap = (a: string, b: string) =>
  a === b || a.startsWith(b + sep) || b.startsWith(a + sep);
/** Recovery never removes a stage that any project still references, including aliases.
 * Unknown/linked state is preserved for review. No whole-cache retention policy here.
 */
export function removeDependencyStage(db: DatabaseSync, stateDir: string, id: string) {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id))
    return false;
  const stage = resolve(join(realpathSync(stateDir), "dependencies", id));
  try {
    if (!lstatSync(stage).isDirectory() || realpathSync(stage) !== stage) return false;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return true;
    throw e;
  }
  for (const row of db
    .prepare(
      "SELECT check_dependencies FROM projects WHERE check_dependencies IS NOT NULL",
    )
    .all()) {
    const reference = resolve(String(row.check_dependencies));
    if (overlap(reference, stage)) return false;
    try {
      if (overlap(realpathSync(reference), stage)) return false;
    } catch {
      return false;
    }
  }
  rmSync(stage, { recursive: true, force: true });
  return true;
}
