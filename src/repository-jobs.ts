import { type DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  githubURL,
  branchName,
  repositoryGit,
  inspectRepository,
  updateRepository,
  type RepositoryGit,
} from "./repositories.ts";
import { requireSpace, type Limits } from "./resources.ts";
import { operationSlot } from "./operation-slot.ts";
import { type GitHubAccess } from "./github-account.ts";
type Options = {
  db: DatabaseSync;
  stateDir: string;
  worktrees: string;
  projectsDir?: string;
  limits: Limits;
  project: (id: string) => any;
  activeProject: () => unknown;
  title: (value: unknown) => string;
  closing: () => boolean;
  blocked: () => boolean;
  profile: (required?: GitHubAccess) => string | undefined;
  audit: (action: string, task: string | null, detail: any) => void;
  command?: RepositoryGit;
};
export function repositoryJobs(options: Options) {
  const db = options.db,
    slot = operationSlot("repository");
  let updatingProject: string | null = null;
  const repositoryView = () =>
    db
      .prepare("SELECT * FROM repository_jobs ORDER BY updated DESC,rowid DESC LIMIT 20")
      .all()
      .map((row: any) => ({
        ...row,
        result: row.result ? JSON.parse(String(row.result)) : null,
      }));
  function startRepository(input: any) {
    requireSpace([options.stateDir, options.worktrees], options.limits.reserveBytes);
    if (options.closing())
      throw Error("Service is stopping. Try again after it restarts.");
    if (options.blocked())
      throw Error("Wait for the current repository or GitHub connection operation.");
    slot.assertAvailable();
    const kind = input.kind;
    if (!["inspect", "import", "update"].includes(kind))
      throw Error("Unsupported repository operation");
    const existing = kind === "update" ? options.project(input.project) : null;
    if (existing) {
      if (existing.archived) throw Error("Restore this project before updating it.");
      if (!existing.github_url || !existing.github_branch)
        throw Error("Only projects imported from GitHub can be updated here.");
      if (
        options.activeProject() === existing.id ||
        db
          .prepare(
            "SELECT id FROM tasks WHERE project=? AND (status IN ('waiting_for_approval','queued','running','cancelling') OR review='pending') LIMIT 1",
          )
          .get(existing.id)
      )
        throw Error("Finish or cancel project work and resolve reviews before updating.");
    }
    const source = githubURL(existing?.github_url ?? input.url),
      branch =
        kind === "inspect" ? null : branchName(existing?.github_branch ?? input.branch);
    const name = kind === "import" ? options.title(input.name) : null,
      id = randomUUID(),
      projectId = existing
        ? String(existing.id)
        : kind === "import"
          ? randomUUID()
          : null;
    if (
      kind === "import" &&
      db
        .prepare("SELECT id FROM projects WHERE github_url=? AND github_branch=?")
        .get(source, branch)
    )
      throw Error(
        "This repository branch is already a project. Restore it from History if archived.",
      );
    db.prepare("INSERT INTO repository_jobs VALUES(?,?,?,?,?,?,?,?,?)").run(
      id,
      kind,
      "running",
      projectId,
      source,
      branch,
      null,
      null,
      new Date().toISOString(),
    );
    const path =
      kind === "import"
        ? join(options.projectsDir ?? join(options.stateDir, "projects"), projectId!)
        : null;
    const git =
      options.command ??
      repositoryGit({
        stateDir: options.stateDir,
        githubProfile: options.profile("repositories"),
      });
    updatingProject = existing ? String(existing.id) : null;
    slot.start(
      id,
      async (signal) => {
        let registered = false;
        try {
          if (signal.aborted) throw Error("Repository operation cancelled.");
          let result: any;
          if (kind === "inspect")
            result = await inspectRepository(git, options.stateDir, source, signal);
          else if (kind === "update")
            result = await updateRepository(
              git,
              String(existing!.repo),
              source,
              branch!,
              signal,
            );
          else {
            mkdirSync(path!, { recursive: true, mode: 0o700 });
            await git(
              path!,
              [
                "clone",
                "--depth",
                "100",
                "--single-branch",
                "--no-tags",
                "--no-recurse-submodules",
                "--branch",
                branch!,
                "--",
                source,
                ".",
              ],
              signal,
              true,
              path!,
            );
            if (signal.aborted) throw Error("Import cancelled.");
            const revision = await git(path!, ["rev-parse", "HEAD"], signal);
            db.prepare(
              "INSERT INTO projects(id,name,repo,created,github_url,github_branch) VALUES(?,?,?,?,?,?)",
            ).run(projectId, name, path, new Date().toISOString(), source, branch);
            registered = true;
            result = { project: projectId, revision };
          }
          db.prepare(
            "UPDATE repository_jobs SET state='succeeded',result=?,updated=? WHERE id=?",
          ).run(JSON.stringify(result), new Date().toISOString(), id);
          options.audit("repository-" + kind, null, {
            project: projectId,
            source,
            branch,
          });
        } catch (error) {
          if (path && !registered)
            try {
              rmSync(path, { recursive: true, force: true });
            } catch {}
          db.prepare(
            "UPDATE repository_jobs SET state=?,error=?,updated=? WHERE id=?",
          ).run(
            signal.aborted ? "cancelled" : "failed",
            (error as Error).message,
            new Date().toISOString(),
            id,
          );
        }
      },
      () => {
        updatingProject = null;
      },
    );
    return repositoryView().find((job) => job.id === id);
  }

  return {
    view: repositoryView,
    start: startRepository,
    busy: slot.busy,
    projectBusy: (id: string) => slot.busy() && updatingProject === id,
    cancel(id: string) {
      if (!slot.cancel(id)) throw Error("Repository operation not found.");
      return { ok: true };
    },
    close: slot.close,
  };
}
