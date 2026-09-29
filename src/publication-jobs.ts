import { type DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { rmSync } from "node:fs";
import { localGit } from "./git-policy.ts";
import { operationSlot } from "./operation-slot.ts";
import { branchName, repositoryGit, type RepositoryGit } from "./repositories.ts";
import {
  integrationGit,
  githubReviewAPI,
  loadFeedback,
  materializeIntegration,
  selectedFeedback,
  prepareIntegration,
  type ReviewAPI,
} from "./github-review.ts";
import {
  previewPublication,
  executePublication,
  githubPullAPI,
  publicationText,
  type PullAPI,
  type PublishPlan,
} from "./publishing.ts";
type Options = {
  db: DatabaseSync;
  stateDir: string;
  worktrees: string;
  task: (id: string) => any;
  project: (id: string) => any;
  conversation: (id: string) => any;
  blocked: (operation: "publication" | "feedback") => boolean;
  profile: () => string | undefined;
  requireAdapter: (id: string, mode: "edit") => unknown;
  bindExecution: (id: string) => unknown;
  audit: (action: string, task: string | null, detail: any) => void;
  repositoryCommand?: RepositoryGit;
  pullAPI?: PullAPI;
  reviewAPI?: ReviewAPI;
};
/** Publishing and feedback intentionally share one owned operation slot. */
export function publicationJobs(c: Options) {
  const {
    db,
    task: get,
    project,
    conversation,
    blocked,
    requireAdapter,
    bindExecution,
    audit,
  } = c;
  const slot = operationSlot("publication-review");
  const git = (args: string[], repo: string) => localGit(repo, args);
  const publicationView = (task: string) =>
    db
      .prepare(
        "SELECT id,task,state,plan,error,url,updated,expires FROM publications WHERE task=? ORDER BY rowid DESC LIMIT 5",
      )
      .all(task)
      .map((row: any) => ({ ...row, plan: row.plan ? JSON.parse(row.plan) : null }));
  const publishTarget = (id: string) => {
    const row = get(id);
    if (!row || row.review !== "committed" || !row.commit_sha)
      throw Error("Approve a local commit with passing checks before publishing.");
    const p = project(String(row.project));
    if (p.archived) throw Error("Restore this project before publishing.");
    return { row, p };
  };
  const approvedCommit = (projectId: string, sha: string, tree: string) => {
    const row = db
      .prepare(
        "SELECT checks FROM tasks WHERE project=? AND commit_sha=? AND review='committed'",
      )
      .get(projectId, sha);
    if (!row) return false;
    const checks = JSON.parse(String(row.checks ?? "{}"));
    return (
      checks.status === "passed" && checks.input === "git-tree-v1" && checks.tree === tree
    );
  };
  const publicationTargets = (task: string, includeCurrent = false) => {
    const { row } = publishTarget(task);
    return db
      .prepare(
        "SELECT p.id,p.url,p.plan FROM publications p JOIN tasks t ON t.id=p.task WHERE p.state='published' AND t.conversation=? AND t.project=? AND t.id!=? ORDER BY p.rowid DESC",
      )
      .all(row.conversation, row.project, includeCurrent ? "" : task)
      .map((p: any) => ({ id: p.id, url: p.url, plan: JSON.parse(p.plan) }))
      .filter(
        (p: any, i: number, list: any[]) =>
          list.findIndex((q) => q.plan.branch === p.plan.branch) === i,
      )
      .map((p: any) => ({
        id: p.id,
        url: p.url,
        branch: p.plan.branch,
        base: p.plan.base,
        head: p.plan.head,
      }));
  };
  function startPublication(input: any, approve = false) {
    if (!/^[a-f0-9]{64}$/.test(input.owner ?? ""))
      throw Error("Authenticated browser session required.");
    if (blocked("publication"))
      throw Error(
        "Wait for current publishing, repository, dependency or GitHub sign-in work.",
      );
    slot.assertAvailable();
    const profile = c.profile();
    if (!profile && !c.pullAPI)
      throw Error("Connect GitHub before preparing publication.");
    const stored = approve
      ? db.prepare("SELECT * FROM publications WHERE id=?").get(input.id)
      : null;
    if (
      approve &&
      (!stored ||
        stored.owner !== input.owner ||
        stored.state !== "ready" ||
        Number(stored.expires) < Date.now())
    )
      throw Error(
        "This approval expired or belongs to another browser. Create a fresh preview.",
      );
    const task = String(stored?.task ?? input.task),
      { row, p } = publishTarget(task),
      published = publicationView(task).find((job) => job.state === "published");
    if (published) return published;
    const plan: PublishPlan | null = approve ? JSON.parse(String(stored!.plan)) : null;
    if (approve && input.fingerprint !== plan!.fingerprint)
      throw Error("Preview changed. Review it again.");
    if (plan && plan.head !== row.commit_sha)
      throw Error("Approved local commit changed. Preview again.");
    let update:
      | {
          destination: string;
          branch: string;
          head: string;
          base: string;
          number: number;
        }
      | undefined;
    if (!approve && input.updateOf) {
      const target = publicationTargets(task).find((p) => p.id === input.updateOf);
      if (!target) throw Error("Select a published PR from this conversation.");
      const previous: any = db
          .prepare("SELECT plan FROM publications WHERE id=?")
          .get(target.id),
        value = JSON.parse(previous.plan);
      update = {
        destination: value.destination,
        branch: value.branch,
        head: value.head,
        base: value.base,
        number: Number(target.url.match(/\/pull\/(\d+)$/)?.[1]),
      };
    }
    const fields = approve ? plan! : publicationText(input.title, input.body),
      base = approve ? plan!.base : branchName(input.base),
      id = approve ? String(stored!.id) : randomUUID(),
      gitCommand =
        c.repositoryCommand ??
        repositoryGit({ stateDir: c.stateDir, githubProfile: profile });
    if (approve) {
      db.prepare(
        "UPDATE publications SET state='publishing',error=NULL,updated=? WHERE id=?",
      ).run(new Date().toISOString(), id);
      audit("approve-publication", task, {
        publication: id,
        fingerprint: plan!.fingerprint,
        destination: plan!.destination,
        head: plan!.head,
        base: plan!.base,
        baseSha: plan!.baseSha,
      });
    } else
      db.prepare("INSERT INTO publications VALUES(?,?,?,?,?,?,?,?,?)").run(
        id,
        task,
        input.owner,
        "preparing",
        null,
        null,
        null,
        new Date().toISOString(),
        Date.now() + 900000,
      );
    void slot.start(id, async (signal) => {
      try {
        if (signal.aborted) throw Error("Preparation cancelled.");
        if (!approve) {
          const preview = await previewPublication({
            git: gitCommand,
            repo: String(p.repo),
            task,
            head: String(row.commit_sha),
            base,
            title: fields.title,
            body: fields.body,
            update,
            api: c.pullAPI ?? githubPullAPI(c.stateDir, profile!),
            approved: (sha, tree) => approvedCommit(String(p.id), sha, tree),
            approvedMerge: (sha, parents) => {
              const t = db
                .prepare(
                  "SELECT revision,merge_parent FROM tasks WHERE project=? AND commit_sha=? AND review='committed'",
                )
                .get(p.id, sha);
              return !!t && parents.join(" ") === [t.revision, t.merge_parent].join(" ");
            },
            signal,
          });
          db.prepare(
            "UPDATE publications SET state='ready',plan=?,updated=?,expires=? WHERE id=?",
          ).run(
            JSON.stringify(preview),
            new Date().toISOString(),
            Date.now() + 900000,
            id,
          );
        } else {
          for (const commit of plan!.commits) {
            const tree = await gitCommand(
              String(p.repo),
              ["rev-parse", commit.sha + "^{tree}"],
              signal,
            );
            if (!approvedCommit(String(p.id), commit.sha, tree))
              throw Error("Commit approval or check results changed. Preview again.");
          }
          const result = await executePublication(
            gitCommand,
            c.pullAPI ?? githubPullAPI(c.stateDir, profile!),
            String(p.repo),
            plan!,
            signal,
            (stage) =>
              db
                .prepare("UPDATE publications SET state=?,updated=? WHERE id=?")
                .run(stage, new Date().toISOString(), id),
          );
          db.prepare(
            "UPDATE publications SET state='published',url=?,error=?,updated=? WHERE id=?",
          ).run(
            result.url,
            result.reused
              ? "Existing pull request reused; its current title, description and state were kept."
              : null,
            new Date().toISOString(),
            id,
          );
          audit("published", task, {
            publication: id,
            url: result.url,
            head: plan!.head,
            reused: result.reused,
          });
        }
      } catch (error) {
        db.prepare("UPDATE publications SET state=?,error=?,updated=? WHERE id=?").run(
          approve ? "needs_attention" : "failed",
          (error as Error).message,
          new Date().toISOString(),
          id,
        );
      }
    });
    return publicationView(task).find((job) => job.id === id);
  }
  const feedbackView = (task: string, owner: string) =>
    db
      .prepare(
        "SELECT id,kind,state,plan,error,result,expires FROM review_jobs WHERE task=? AND owner=? ORDER BY rowid DESC LIMIT 10",
      )
      .all(task, owner)
      .map((r: any) => ({ ...r, plan: r.plan ? JSON.parse(r.plan) : null }));
  function latestCommitted(task: string) {
    const target = publishTarget(task);
    if (conversation(String(target.row.conversation)).archived)
      throw Error("Restore this conversation first.");
    if (
      db
        .prepare(
          "SELECT id FROM tasks WHERE conversation=? ORDER BY created DESC,rowid DESC LIMIT 1",
        )
        .get(target.row.conversation)?.id !== task
    )
      throw Error("Open the latest committed turn before continuing.");
    return target;
  }
  function feedback(input: any) {
    if (!/^[a-f0-9]{64}$/.test(input.owner ?? ""))
      throw Error("Authenticated browser session required.");
    if (input.op === "feedback-targets") return publicationTargets(input.task, true);
    if (input.op === "feedback-status") {
      publishTarget(input.task);
      return feedbackView(input.task, input.owner);
    }
    if (input.op === "feedback-cancel") {
      const stored = db.prepare("SELECT * FROM review_jobs WHERE id=?").get(input.id);
      if (!stored || stored.owner !== input.owner)
        throw Error("This operation belongs to another browser.");
      if (!["preparing", "applying"].includes(String(stored.state)))
        return feedbackView(String(stored.task), input.owner).find(
          (job: any) => job.id === stored.id,
        );
      if (!slot.cancel(String(stored.id)))
        throw Error("This operation is no longer active. Refresh its status.");
      return { id: stored.id, state: "cancelling" };
    }
    const applying = input.op === "feedback-apply",
      stored = applying
        ? db.prepare("SELECT * FROM review_jobs WHERE id=?").get(input.id)
        : null;
    if (applying && (!stored || stored.owner !== input.owner))
      throw Error("This preview belongs to another browser.");
    const plan = stored?.plan ? JSON.parse(String(stored.plan)) : null;
    if (applying && (!plan || input.fingerprint !== plan.fingerprint))
      throw Error("Preview changed. Review again.");
    const chosen =
      applying && stored!.kind === "comments"
        ? selectedFeedback(plan, input.keys, input.instruction)
        : null;
    if (stored?.state === "applied") {
      if (chosen && chosen.selection !== stored.selection)
        throw Error("A different selection was already imported.");
      return get(String(stored.result));
    }
    if (applying && stored!.kind === "integration" && stored!.state === "applying")
      return feedbackView(String(stored!.task), input.owner).find(
        (job: any) => job.id === stored!.id,
      );
    if (
      applying &&
      (!["ready", "interrupted"].includes(String(stored!.state)) ||
        Number(stored!.expires) < Date.now())
    )
      throw Error("Preview expired. Prepare it again.");
    const task = String(stored?.task ?? input.task),
      { row, p } = latestCommitted(task);
    if (blocked("feedback"))
      throw Error(
        "Wait for current work before preparing GitHub feedback or integration.",
      );
    slot.assertAvailable();
    requireAdapter(String(row.adapter), "edit");
    if (applying && stored!.kind === "comments") {
      if (plan.sourceHead !== row.commit_sha)
        throw Error("The local commit changed. Prepare again.");
      const id = randomUUID(),
        at = new Date().toISOString();
      db.exec("BEGIN");
      try {
        db.prepare(
          "INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,project,conversation,attachments,parent,mode,seed_tree,merge_parent,conflict_paths,worktree,review) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          row.adapter,
          chosen!.prompt,
          row.commit_sha,
          "waiting_for_approval",
          at,
          at,
          row.project,
          row.conversation,
          "[]",
          row.id,
          "edit",
          null,
          null,
          null,
          null,
          null,
        );
        bindExecution(id);
        db.prepare("INSERT INTO events(task,status,at) VALUES(?,?,?)").run(
          id,
          "waiting_for_approval",
          at,
        );
        db.prepare(
          "UPDATE review_jobs SET state='applied',result=?,selection=?,updated=? WHERE id=?",
        ).run(id, chosen?.selection ?? null, at, stored!.id);
        audit("import-feedback", id, {
          source: task,
          preview: stored!.id,
          fingerprint: plan.fingerprint,
          selection: chosen?.selection ?? null,
        });
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return get(id);
    }
    if (applying) {
      if (plan.sourceHead !== row.commit_sha)
        throw Error("The local commit changed. Prepare again.");
      const id =
          typeof stored!.result === "string" &&
          /^[a-f0-9-]{36}$/.test(String(stored!.result))
            ? String(stored!.result)
            : randomUUID(),
        repo = String(p.repo),
        worktree = join(c.worktrees, id),
        gitCommand =
          c.repositoryCommand ??
          repositoryGit({ stateDir: c.stateDir, githubProfile: c.profile() });
      const recovered = get(id);
      if (recovered) {
        db.prepare(
          "UPDATE review_jobs SET state='applied',error=NULL,updated=? WHERE id=?",
        ).run(new Date().toISOString(), stored!.id);
        return recovered;
      }
      db.exec("BEGIN");
      try {
        db.prepare(
          "UPDATE review_jobs SET state='applying',result=?,error=NULL,updated=? WHERE id=?",
        ).run(id, new Date().toISOString(), stored!.id);
        audit("approve-integration", task, {
          preview: stored!.id,
          fingerprint: plan.fingerprint,
        });
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      void slot.start(String(stored!.id), async (signal) => {
        const cleanup = async () => {
          let registrationGone = false;
          try {
            await gitCommand(
              repo,
              ["worktree", "remove", "--force", worktree],
              new AbortController().signal,
            );
            registrationGone = true;
          } catch {
            try {
              const registered = await gitCommand(
                repo,
                ["worktree", "list", "--porcelain", "-z"],
                new AbortController().signal,
              );
              registrationGone = !registered
                .split("\0")
                .some((line) => line === "worktree " + worktree);
            } catch {}
          }
          try {
            rmSync(worktree, { recursive: true, force: true });
          } catch {
            return false;
          }
          return registrationGone;
        };
        try {
          if (stored!.state === "interrupted" && !(await cleanup()))
            throw Error(
              "Could not reconcile the interrupted integration worktree safely.",
            );
          const current = latestCommitted(task);
          if (current.row.commit_sha !== plan.sourceHead)
            throw Error("The local commit changed. Prepare again.");
          if (
            (await gitCommand(
              repo,
              ["rev-parse", "refs/agentd/integrations/" + stored!.id],
              signal,
            )) !== plan.tree ||
            (await gitCommand(
              repo,
              ["rev-parse", "refs/agentd/integration-bases/" + stored!.id],
              signal,
            )) !== plan.baseSha
          )
            throw Error("The retained integration snapshot changed. Prepare again.");
          await materializeIntegration(
            gitCommand,
            repo,
            worktree,
            plan.baseSha,
            plan.tree,
            signal,
          );
          const final = latestCommitted(task);
          if (final.row.commit_sha !== plan.sourceHead)
            throw Error("The local commit changed. Prepare again.");
          const at = new Date().toISOString();
          db.exec("BEGIN");
          try {
            db.prepare(
              "INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,project,conversation,attachments,parent,mode,seed_tree,merge_parent,conflict_paths,worktree,review) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            ).run(
              id,
              row.adapter,
              "Integrate " +
                plan.base +
                " at " +
                plan.baseSha +
                ". Review the combined changes and resolve any conflicts before checks and commit.",
              plan.baseSha,
              "succeeded",
              at,
              at,
              row.project,
              row.conversation,
              "[]",
              row.id,
              "edit",
              plan.tree,
              plan.head,
              JSON.stringify(plan.conflicts),
              worktree,
              "pending",
            );
            db.prepare("INSERT INTO events(task,status,at) VALUES(?,?,?)").run(
              id,
              "succeeded",
              at,
            );
            db.prepare(
              "UPDATE review_jobs SET state='applied',error=NULL,updated=? WHERE id=?",
            ).run(at, stored!.id);
            audit("create-integration-review", id, {
              source: task,
              preview: stored!.id,
              fingerprint: plan.fingerprint,
            });
            db.exec("COMMIT");
          } catch (error) {
            db.exec("ROLLBACK");
            throw error;
          }
        } catch (error) {
          const cleaned = await cleanup();
          db.prepare(
            "UPDATE review_jobs SET state=?,error=?,updated=? WHERE id=? AND state='applying'",
          ).run(
            signal.aborted && cleaned ? "ready" : "failed",
            !cleaned
              ? "Could not confirm cleanup of the integration worktree. Review it before retrying."
              : signal.aborted
                ? "Integration review creation cancelled."
                : (error as Error).message,
            new Date().toISOString(),
            stored!.id,
          );
        }
      });
      return feedbackView(task, input.owner).find((job: any) => job.id === stored!.id);
    }
    const kind = input.kind;
    if (!["comments", "integration"].includes(kind))
      throw Error("Unsupported review operation");
    slot.assertAvailable();
    const profile = c.profile();
    if (!profile && !c.reviewAPI && !c.repositoryCommand)
      throw Error("Connect GitHub first.");
    let publication: any = null;
    if (kind === "comments") {
      const target = publicationTargets(task, true).find(
        (t) => t.id === input.publication,
      );
      if (!target) throw Error("Choose a published PR from this conversation.");
      publication = {
        plan: JSON.parse(
          String(
            db.prepare("SELECT plan FROM publications WHERE id=?").get(target.id)!.plan,
          ),
        ),
        number: Number(target.url.match(/\/pull\/(\d+)$/)?.[1]),
      };
    }
    const id = randomUUID();
    db.prepare("INSERT INTO review_jobs VALUES(?,?,?,?,?,?,?,?,?,?,?)").run(
      id,
      kind,
      task,
      input.owner,
      "preparing",
      null,
      null,
      null,
      null,
      new Date().toISOString(),
      Date.now() + 1800000,
    );
    void slot.start(id, async (signal) => {
      try {
        if (signal.aborted) throw Error("Preparation cancelled.");
        const value =
          kind === "comments"
            ? await loadFeedback(
                c.reviewAPI ?? githubReviewAPI(c.stateDir, profile!),
                publication.plan,
                publication.number,
                signal,
              )
            : await prepareIntegration(
                c.repositoryCommand ??
                  repositoryGit({ stateDir: c.stateDir, githubProfile: profile }),
                String(p.repo),
                String(row.commit_sha),
                input.base,
                signal,
              );
        if (signal.aborted) throw Error("Preparation cancelled.");
        latestCommitted(task);
        if (kind === "integration") {
          integrationGit(String(p.repo), [
            "update-ref",
            "refs/agentd/integrations/" + id,
            (value as any).tree,
          ]);
          integrationGit(String(p.repo), [
            "update-ref",
            "refs/agentd/integration-bases/" + id,
            (value as any).baseSha,
          ]);
        }
        db.prepare(
          "UPDATE review_jobs SET state='ready',plan=?,updated=? WHERE id=?",
        ).run(
          JSON.stringify({ ...value, sourceHead: row.commit_sha }),
          new Date().toISOString(),
          id,
        );
      } catch (error) {
        db.prepare("UPDATE review_jobs SET state='failed',error=? WHERE id=?").run(
          (error as Error).message,
          id,
        );
      }
    });
    return { id, state: "preparing" };
  }
  return {
    start: startPublication,
    targets: publicationTargets,
    feedback,
    status(task: string) {
      publishTarget(task);
      return publicationView(task);
    },
    busy: slot.busy,
    close: slot.close,
  };
}
