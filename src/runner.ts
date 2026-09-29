import { removeDependencyStage } from "./dependency-recovery.ts";
import { repositoryJobs } from "./repository-jobs.ts";
import { dependencyJobs } from "./dependency-jobs.ts";
import { admissionBlocked, type Operation, type BusyState } from "./operation-policy.ts";
import { prepareWorktree } from "./worktree-preparation.ts";
import { creationRequests } from "./creation-requests.ts";
import { followupContext, contextPrompt } from "./followup-context.ts";
import { testedVersions } from "./native-policy.ts";
import { AsyncLocalStorage } from "node:async_hooks";
import { localGit } from "./git-policy.ts";
import {
  resourceLimits,
  requireSpace,
  freeBytes,
  captureOutput,
  monitorWorktree,
  serviceBudget,
  type Limits,
} from "./resources.ts";
import { retention } from "./retention.ts";
import { attachmentStore } from "./attachment-store.ts";
import { gatewaySocket } from "./gateway-protocol.ts";
import { initializeTaskDatabase } from "./task-database.ts";
import { settings, resolveSettings, type Settings } from "./execution-settings.ts";
import { modelCatalog, discoverModels } from "./model-catalog.ts";
import { unresolvedConflicts, type ReviewAPI } from "./github-review.ts";
import { type PullAPI } from "./publishing.ts";
import { publicationJobs } from "./publication-jobs.ts";
import { checkManifest, type DependencyPreparation } from "./check-setup.ts";
import {
  adapterIds,
  invocation,
  discover,
  probeAccount,
  probeNativeVersion,
  verifySelectionVersion,
  type NativeVersion,
  type AccountStatus,
  type Mode,
} from "./adapters.ts";
import { renewals, renewalFailure } from "./renewal.ts";
import { type RepositoryGit } from "./repositories.ts";
import { githubAccount } from "./github-account.ts";
import { accounts } from "./accounts.ts";
import { snapshot, commitSnapshot, checkSnapshot } from "./changes.ts";
import { isolated } from "./isolation.ts";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { spawn, type ChildProcess } from "node:child_process";
import { homedir } from "node:os";
import { randomUUID, createHash } from "node:crypto";
import {
  mkdirSync,
  openSync,
  writeSync,
  closeSync,
  realpathSync,
  readFileSync,
  copyFileSync,
  statSync,
  readSync,
  existsSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join, isAbsolute } from "node:path";
import { createServer } from "node:net";

type Config = {
  prepareWorktree?: typeof prepareWorktree;
  nativeVersion?: typeof probeNativeVersion;
  resources?: Limits;
  gateway?: { path: string; gid: number };
  modelDiscovery?: typeof discoverModels;
  stateDir: string;
  repo: string;
  worktrees: string;
  logs: string;
  editing?: boolean;
  editAdapters?: string[];
  enabledAdapters?: string[];
  strictWorkers?: boolean;
  codexChat?: boolean;
  credentialRenewal?: boolean;
  pullAPI?: PullAPI;
  reviewAPI?: ReviewAPI;
  prepareDependencies?: DependencyPreparation;
  repositoryCommand?: RepositoryGit;
  githubRoot?: string;
  renewal?: {
    reconcile?: () => void;
    ensure: (id: string) => Promise<void>;
    view: (id: string) => unknown;
    busy: () => boolean;
    close: () => Promise<void>;
  };
  isolate?: typeof isolated;
  projectsDir?: string;
  attachments?: string;
  timeoutMs?: number;
  command?: (adapter: string, prompt: string, mode?: string) => [string, string[]];
  accountStatus?: (adapter: string) => Promise<AccountStatus> | AccountStatus;
};
export function runner(c: Config) {
  if (
    c.enabledAdapters?.includes("cursor") &&
    !c.command &&
    (!c.strictWorkers || !c.credentialRenewal)
  )
    throw Error("Cursor requires hardened isolation and access-only credential handling");
  if (c.credentialRenewal && !c.strictWorkers)
    throw Error("Credential renewal requires hardened isolation");
  if (c.codexChat && !c.strictWorkers)
    throw Error("Chat only requires hardened worker isolation");
  for (const dir of [c.stateDir, c.worktrees, c.logs])
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(c.stateDir, "tasks.sqlite"));
  try {
    initializeTaskDatabase(db, realpathSync(c.repo));
  } catch (error) {
    db.close();
    throw error;
  }
  for (const job of db
    .prepare(
      "SELECT project FROM repository_jobs WHERE kind='import' AND state IN ('interrupted','failed','cancelled')",
    )
    .all()) {
    const id = String(job.project);
    if (
      /^[a-f0-9-]{36}$/.test(id) &&
      !db.prepare("SELECT id FROM projects WHERE id=?").get(id)
    )
      rmSync(join(c.projectsDir ?? join(c.stateDir, "projects"), id), {
        recursive: true,
        force: true,
      });
  }
  for (const job of db
    .prepare("SELECT id FROM dependency_jobs WHERE state!='succeeded'")
    .all())
    removeDependencyStage(db, c.stateDir, String(job.id));
  for (const name of readdirSync(c.stateDir))
    if (name.startsWith("worker-") || name.startsWith("git-home-"))
      rmSync(join(c.stateDir, name), { recursive: true, force: true });
  const enabledAdapters = c.enabledAdapters ?? ["codex", "claude"];
  const editAdapters = c.editing ? (c.editAdapters ?? []) : [];
  if ([...enabledAdapters, ...editAdapters].some((value) => !adapterIds.includes(value)))
    throw Error("Invalid adapter configuration");
  const limits = c.resources ?? resourceLimits;
  const receipts = creationRequests(db);
  const auditContext = new AsyncLocalStorage<{
    kind: "browser" | "local" | "system";
    session?: string;
  }>();
  const audit = (action: string, task: string | null, detail: unknown = {}) =>
    db.prepare("INSERT INTO audit(at,action,task,detail) VALUES(?,?,?,?)").run(
      new Date().toISOString(),
      action,
      task,
      JSON.stringify({
        ...(detail as object),
        actor: auditContext.getStore() ?? { kind: "system" },
      }),
    );
  const auditedWrite = (
    action: string,
    task: string | null,
    detail: unknown,
    write: () => unknown,
  ) => {
    db.exec("BEGIN");
    try {
      write();
      audit(action, task, detail);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  };
  const storage = retention(db, { worktrees: c.worktrees, logs: c.logs }, audit);
  const project = (id: string) => {
    const value = db.prepare("SELECT * FROM projects WHERE id=?").get(id);
    if (!value) throw new Error("Project not found");
    return value;
  };
  const conversation = (id: string) => {
    const value = db.prepare("SELECT * FROM conversations WHERE id=?").get(id);
    if (!value) throw new Error("Conversation not found");
    return value;
  };
  const title = (value: unknown) => {
    if (typeof value !== "string" || !value.trim() || value.trim().length > 100)
      throw new Error("Name must contain 1 to 100 characters");
    return value.trim();
  };
  const attachmentRoot = c.attachments ?? join(c.stateDir, "attachments");
  mkdirSync(attachmentRoot, { recursive: true, mode: 0o700 });
  const images = attachmentStore(attachmentRoot);
  const attachment = images.metadata;
  const logTail = (path: string, limit = 60000) => {
    if (!existsSync(path)) return "";
    const fd = openSync(path, "r");
    try {
      const size = statSync(path).size;
      const b = Buffer.alloc(Math.min(size, limit));
      readSync(fd, b, 0, b.length, Math.max(0, size - b.length));
      return b.toString("utf8");
    } finally {
      closeSync(fd);
    }
  };
  let active:
    | {
        id: string;
        child?: ChildProcess;
        done: Promise<void>;
        stop: (status: string) => void;
      }
    | undefined;
  let closing = false;
  const get = (id: string) => db.prepare("SELECT * FROM tasks WHERE id=?").get(id);
  const transition = (id: string, status: string, error: string | null = null) => {
    const at = new Date().toISOString();
    db.prepare("UPDATE tasks SET status=?,updated=?,error=? WHERE id=?").run(
      status,
      at,
      error,
      id,
    );
    db.prepare("INSERT INTO events(task,status,at) VALUES(?,?,?)").run(id, status, at);
  };
  const git = (args: string[], repo = c.repo) => localGit(repo, args);
  const github = githubAccount(c.githubRoot ?? join(c.stateDir, "github"));
  function blocked(operation: Operation) {
    const read = (state: BusyState): boolean => {
      switch (state) {
        case "repository":
          return repositoryManager.busy();
        case "publication":
          return publicationManager.busy();
        case "dependency":
          return dependencyManager.busy();
        case "github":
          return github.busy();
        case "worker":
          return !!active;
        case "account":
          return accountBusy();
        case "queued":
          return !!db.prepare("SELECT id FROM tasks WHERE status='queued'").get();
        case "probes":
          return checkingAccounts;
        case "closing":
          return closing;
        case "models":
          return catalog.busy();
        case "preparing":
          return !!preparing;
        case "renewal":
          return !!renewalManager?.busy();
        case "renewalProbe":
          return !!renewalManager && checkingAccounts;
        case "unsettled":
          return !!db
            .prepare(
              "SELECT id FROM tasks WHERE status IN ('queued','running','cancelling')",
            )
            .get();
        case "reviewPreparation":
          return !!db.prepare("SELECT id FROM review_jobs WHERE state='preparing'").get();
      }
    };
    return admissionBlocked(operation, read);
  }
  const repositoryManager = repositoryJobs({
    db,
    stateDir: c.stateDir,
    worktrees: c.worktrees,
    projectsDir: c.projectsDir,
    limits,
    project,
    title,
    activeProject: () => (active ? get(active.id)?.project : null),
    closing: () => closing,
    blocked: () => blocked("repository"),
    profile: () => github.profile(),
    audit,
    command: c.repositoryCommand,
  });
  const projectBusy = repositoryManager.projectBusy;
  const dependencyManager = dependencyJobs({
    db,
    stateDir: c.stateDir,
    limits,
    project,
    task: get,
    blocked: () => blocked("dependencies"),
    settled: () => {
      if (!closing) setImmediate(pump);
    },
    audit,
    prepare: c.prepareDependencies,
  });
  const publicationManager = publicationJobs({
    db,
    stateDir: c.stateDir,
    worktrees: c.worktrees,
    task: get,
    project,
    conversation,
    blocked,
    profile: () => github.profile(),
    requireAdapter: (id, mode) => requireAdapter(id, mode),
    bindExecution,
    audit,
    repositoryCommand: c.repositoryCommand,
    pullAPI: c.pullAPI,
    reviewAPI: c.reviewAPI,
  });
  const capabilities = () =>
    discover(enabledAdapters, editAdapters, !!c.command, !!c.codexChat);

  const catalog = modelCatalog(
    join(c.stateDir, "model-catalog"),
    () => {
      refreshPending();
      setImmediate(pump);
    },
    c.modelDiscovery,
  );
  const layer = (scope: string, id: string, agent: string) =>
    JSON.parse(
      String(
        db
          .prepare(
            "SELECT settings FROM execution_settings WHERE scope=? AND scope_id=? AND agent=?",
          )
          .get(scope, id, agent)?.settings ?? "{}",
      ),
    ) as Settings;
  function layers(
    projectId: string,
    conversationId: string | null,
    agent: string,
    overrides: Settings = {},
  ) {
    return [
      { source: "Project", values: layer("project", projectId, "*") },
      { source: "Project · " + agent, values: layer("project", projectId, agent) },
      ...(conversationId
        ? [
            {
              source: "Conversation",
              values: layer("conversation", conversationId, "*"),
            },
            {
              source: "Conversation · " + agent,
              values: layer("conversation", conversationId, agent),
            },
          ]
        : []),
      { source: "Next run", values: overrides },
    ];
  }
  function execution(row: any) {
    requireAdapter(String(row.adapter), String(row.mode));
    const { fingerprint, ...base } = resolveSettings(
      layers(
        String(row.project),
        String(row.conversation),
        String(row.adapter),
        settings(
          JSON.parse(String(row.run_overrides ?? "{}")),
          String(row.adapter),
          true,
        ),
      ),
      String(row.adapter),
      String(row.mode),
      String(row.prompt),
      catalog.view(String(row.adapter)),
      c.timeoutMs ?? 600000,
    );
    const context = followupContext(
      row.parent ? get(String(row.parent)) : null,
      base.settings.context,
    ).summary;
    const payload = { ...base, context };
    return {
      ...payload,
      fingerprint: createHash("sha256").update(JSON.stringify(payload)).digest("hex"),
    };
  }
  function bindExecution(id: string) {
    const value = execution(get(id));
    db.prepare("UPDATE tasks SET execution=?,settings_error=NULL WHERE id=?").run(
      JSON.stringify(value),
      id,
    );
    return value;
  }
  function refreshPending() {
    for (const row of db
      .prepare("SELECT * FROM tasks WHERE status IN ('queued','waiting_for_approval')")
      .all()) {
      try {
        const value = execution(row),
          prior = row.execution ? JSON.parse(String(row.execution)) : null;
        if (value.fingerprint !== prior?.fingerprint || row.settings_error) {
          db.prepare("UPDATE tasks SET execution=?,settings_error=NULL WHERE id=?").run(
            JSON.stringify(value),
            row.id,
          );
          transition(String(row.id), "waiting_for_approval");
          audit("invalidate-run-approval", String(row.id), {
            fingerprint: value.fingerprint,
          });
        }
      } catch (error) {
        db.prepare("UPDATE tasks SET settings_error=? WHERE id=?").run(
          (error as Error).message,
          row.id,
        );
        if (row.status === "queued") transition(String(row.id), "waiting_for_approval");
      }
    }
  }
  function stillApproved(row: any) {
    try {
      const current = execution(row);
      if (
        !row.execution ||
        current.fingerprint !== JSON.parse(String(row.execution)).fingerprint
      ) {
        refreshPending();
        return false;
      }
      return true;
    } catch {
      refreshPending();
      return false;
    }
  }
  function settingsView(
    projectId: string,
    conversationId: string | null,
    agent: string,
    mode = "ask",
    prompt = "",
    overrides: Settings = {},
  ) {
    project(projectId);
    if (conversationId && conversation(conversationId).project !== projectId)
      throw Error("Conversation belongs to another project");
    const scopeLayers = layers(projectId, conversationId, agent, overrides);
    let effective = null,
      error = null;
    try {
      requireAdapter(agent, mode);
      effective = resolveSettings(
        scopeLayers,
        agent,
        mode,
        prompt,
        catalog.view(agent),
        c.timeoutMs ?? 600000,
      );
    } catch (e) {
      error = (e as Error).message;
    }
    const access = scopeLayers.reduce((value, l) => l.values.access ?? value, "edit"),
      modes =
        access === "edit"
          ? ["ask", "edit", "chat"]
          : access === "read"
            ? ["ask", "chat"]
            : access === "chat"
              ? ["chat"]
              : [];
    return {
      allowedModes: (capabilities().find((a) => a.id === agent)?.modes ?? []).filter(
        (m) => modes.includes(m),
      ),
      project: projectId,
      conversation: conversationId,
      agent,
      layers: scopeLayers,
      effective,
      error,
      catalog: catalog.view(agent),
      supported: capabilities().find((a) => a.id === agent),
      maximum: {
        hostPaths: false,
        shell: false,
        mcp: false,
        network: "Selected provider only",
        timeoutSeconds: Math.floor((c.timeoutMs ?? 600000) / 1000),
      },
      active: db
        .prepare(
          "SELECT id,status,execution,conversation FROM tasks WHERE project=? AND status IN ('running','cancelling')",
        )
        .all(projectId),
    };
  }
  const accountCache = new Map<string, AccountStatus>(
    adapterIds.map((id) => [
      id,
      {
        state: "checking",
        method: null,
        checkedAt: null,
        message: "Checking account status",
      },
    ]),
  );
  let preparing: string | undefined, preparation: Promise<void> | undefined;
  const renewalManager = c.credentialRenewal
    ? (c.renewal ?? renewals({ stateDir: c.stateDir }))
    : undefined;
  const accountBusy = () =>
    accountManager.busy() || !!renewalManager?.busy() || !!preparing;
  const versionCache = new Map<string, NativeVersion>();
  let checkingAccounts = false;
  let accountsCheckedAt = 0;
  const refreshAccounts = (force = false) => {
    if (blocked("accountProbe") || (!force && Date.now() - accountsCheckedAt < 300000))
      return;
    checkingAccounts = true;
    void Promise.all(
      adapterIds.map(async (id) => {
        const version = c.nativeVersion ?? (c.command ? undefined : probeNativeVersion);
        const versionCheck = version
          ? version(id)
              .then((value) => versionCache.set(id, value))
              .catch(() =>
                versionCache.set(id, {
                  state: "unavailable",
                  version: null,
                  testedVersion: testedVersions[id],
                  checkedAt: new Date().toISOString(),
                }),
              )
          : Promise.resolve();
        try {
          accountCache.set(id, await (c.accountStatus ?? probeAccount)(id));
        } catch {
          accountCache.set(id, {
            state: "error",
            method: null,
            checkedAt: new Date().toISOString(),
            message: "Could not verify sign-in",
          });
        }
        await versionCheck;
      }),
    ).finally(() => {
      accountsCheckedAt = Date.now();
      checkingAccounts = false;
      if (!closing) setImmediate(pump);
    });
  };
  const accountManager = accounts({
    root: join(c.stateDir, "account-sessions"),
    changed: () => {
      catalog.invalidate();
      renewalManager?.reconcile?.();
      accountsCheckedAt = 0;
      refreshAccounts();
      if (!closing) setImmediate(pump);
    },
  });
  setImmediate(() => refreshAccounts(true));
  const accountTimer = setInterval(() => refreshAccounts(true), 300000);
  accountTimer.unref();
  const operationError = (value: unknown) => {
    if (value === null || value === undefined || value === "") return null;
    const message = String(value);
    if (
      [
        "Output limit reached",
        "Worktree size limit reached",
        "Disk reserve reached. Review storage cleanup before starting more work.",
        "Could not safely write task output",
        "Storage inventory is too large; preserve for manual review",
      ].includes(message)
    )
      return message;
    if (message === renewalFailure) return message;
    if (/^Exit \d+$/.test(message) || message === "Service stopped before completion")
      return message;
    return "Worker could not start";
  };
  const requireAdapter = (id: string, mode: string) => {
    const value = capabilities().find((value) => value.id === id);
    if (!value) throw Error("Unsupported adapter");
    if (!value.available) throw Error(value.reason ?? "Adapter unavailable");
    if (!value.modes.includes(mode))
      throw Error("This work mode is not enabled for this adapter");
  };
  function pump() {
    if (blocked("dispatch")) return;
    const row = db
      .prepare("SELECT * FROM tasks WHERE status='queued' ORDER BY created,id LIMIT 1")
      .get();
    if (!row) return;
    try {
      requireAdapter(String(row.adapter), String(row.mode));
    } catch (error) {
      transition(String(row.id), "failed", (error as Error).message);
      setImmediate(pump);
      return;
    }
    if (!stillApproved(row)) {
      setImmediate(pump);
      return;
    }
    if (renewalManager) {
      preparing = String(row.id);
      preparation = renewalManager
        .ensure(String(row.adapter))
        .then(() => {
          if (!closing && get(String(row.id))?.status === "queued")
            dispatch(get(String(row.id)));
        })
        .catch(() => {
          if (!closing && get(String(row.id))?.status === "queued")
            transition(String(row.id), "failed", renewalFailure);
        })
        .finally(() => {
          preparing = undefined;
          preparation = undefined;
          accountsCheckedAt = 0;
          if (!closing) setImmediate(pump);
        });
    } else dispatch(row);
  }
  async function dispatch(row: any) {
    if (!stillApproved(row)) {
      setImmediate(pump);
      return;
    }
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
    active = {
      id,
      done,
      stop: (status) => {
        if (checkoutReason) return;
        checkoutReason = status;
        transition(id, "cancelling");
        checkoutAbort.abort();
      },
    };
    try {
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
      if (checkoutAbort.signal.aborted || closing)
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
      active = { id, child, done, stop };
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
        active = undefined;
        resolveDone();
        if (!closing) setImmediate(pump);
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
      active = undefined;
      resolveDone();
      if (!closing) setImmediate(pump);
    }
  }
  function available(row: any) {
    if (blocked("review"))
      throw Error("Wait for the active worker before reviewing changes");
    if (
      row.mode !== "edit" ||
      !row.worktree ||
      ["waiting_for_approval", "queued", "running", "cancelling"].includes(row.status)
    )
      throw Error("This run has no finished editable worktree");
  }
  const review = (row: any) => {
    available(row);
    const value = snapshot(String(row.worktree), String(row.revision), c.stateDir);
    return {
      project: row.project,
      ...value,
      mergeParent: row.merge_parent,
      conflicts: row.merge_parent
        ? unresolvedConflicts(String(row.worktree), value.tree, [
            ...new Set([
              ...JSON.parse(String(row.conflict_paths ?? "[]")),
              ...value.files,
            ]),
          ])
        : [],
      checks: row.checks
        ? ((value: any) => ({ ...value, output: value.log ? logTail(value.log) : "" }))(
            JSON.parse(String(row.checks)),
          )
        : null,
      commit: row.commit_sha,
      branch: row.branch,
      decision: row.review,
    };
  };
  function validate(row: any, expected: string) {
    requireSpace([c.stateDir, c.worktrees, c.logs], limits.reserveBytes);
    if (blocked("checks"))
      throw Error("Finish account or dependency preparation before running checks");
    if (projectBusy(String(row.project))) throw Error("Wait for the repository update.");
    available(row);
    if (!["pending", "committed"].includes(row.review))
      throw Error("This review is already resolved");
    const value = snapshot(String(row.worktree), String(row.revision), c.stateDir);
    if (value.tree !== expected) throw Error("Changes have changed. Review again.");
    if (
      row.review === "committed" &&
      git(["rev-parse", String(row.commit_sha) + "^{tree}"], String(row.worktree)) !==
        expected
    )
      throw Error(
        "Committed files changed. Restore the committed content before rechecking.",
      );
    if (review(row).conflicts.length)
      throw Error("Resolve conflict markers before running checks.");
    const p = project(String(row.project));
    if (!p.check_dependencies)
      throw Error("Open Set up checks to prepare this project’s dependencies.");
    const prepared = checkSnapshot(
      String(row.worktree),
      String(row.revision),
      expected,
      c.stateDir,
    );
    let sandbox: ReturnType<typeof isolated> | undefined;
    const log = join(c.logs, String(row.id) + ".checks.log");
    let child: ChildProcess;
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
      child = spawn(sandbox.command, sandbox.args, {
        cwd: prepared.worktree,
        env: { PATH: process.env.PATH, HOME: homedir(), LANG: "C.UTF-8", TERM: "dumb" },
        detached: true,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      try {
        sandbox?.cleanup();
      } finally {
        prepared.cleanup();
      }
      throw error;
    }
    db.prepare("UPDATE tasks SET checks=? WHERE id=?").run(
      JSON.stringify({ status: "running", tree: expected, log, input: "git-tree-v1" }),
      row.id,
    );
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
    active = { id: String(row.id), child, done, stop };
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
          snapshot(String(row.worktree), String(row.revision), c.stateDir).tree !==
          expected
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
      active = undefined;
      resolveDone();
      if (!closing) setImmediate(pump);
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
    return { status: "running" };
  }
  function request(input: any) {
    return auditContext.run({ kind: "local" }, () => handleRequest(input));
  }
  function browserRequest(input: any) {
    const actor = {
      kind: "browser" as const,
      ...(input.owner
        ? {
            session: createHash("sha256")
              .update("agentd-audit-session:" + input.owner)
              .digest("hex"),
          }
        : {}),
    };
    return auditContext.run(actor, () => handleRequest(input));
  }
  function handleRequest(input: any) {
    if (closing) throw new Error("Service is stopping");
    const actor = auditContext.getStore(),
      receipt = receipts.inspect(
        input,
        actor?.kind === "browser" ? "browser:" + actor.session : "local",
      );
    if (receipt?.resultId) {
      const result =
        receipt.operation === "create"
          ? get(receipt.resultId)
          : project(receipt.resultId);
      if (!result)
        throw Error(
          "The original creation result is unavailable. Review History before creating new work.",
        );
      return result;
    }
    if (input.op === "attachment-upload") {
      requireSpace([c.stateDir], limits.reserveBytes);
      return images.upload(input);
    }
    if (input.op === "storage-preview" || input.op === "storage-cleanup") {
      if (blocked("storage"))
        throw Error("Wait for current work before reviewing storage cleanup");
      if (typeof input.owner !== "string" || !/^[a-f0-9]{64}$/.test(input.owner))
        throw Error("Browser owner required");
      return input.op === "storage-preview"
        ? storage.preview(input.owner)
        : storage.apply(input.owner, input.fingerprint);
    }
    if (input.op === "attachment-read") return images.read(input.id);
    if (
      input.op === "settings-view" ||
      input.op === "settings-save" ||
      input.op === "models-refresh"
    ) {
      const projectId = String(input.project ?? "default"),
        conversationId = input.conversation ? String(input.conversation) : null,
        agent = String(input.agent ?? "claude");
      project(projectId);
      if (conversationId && conversation(conversationId).project !== projectId)
        throw Error("Conversation belongs to another project");
      if (!adapterIds.includes(agent)) throw Error("Unsupported adapter");
      if (input.op === "models-refresh") {
        if (blocked("models"))
          throw Error("Wait for active work or account checks before refreshing models");
        catalog.refresh(agent);
        audit("refresh-models", null, {
          adapter: agent,
          actor: input.owner ? "browser" : "local",
        });
      }
      if (input.op === "settings-save") {
        if (!["project", "conversation"].includes(input.scope))
          throw Error("Invalid settings scope");
        const scopeId = input.scope === "project" ? projectId : conversationId;
        if (!scopeId)
          throw Error("Start a conversation before saving conversation settings");
        const target = input.agentScope === "*" ? "*" : agent,
          values = settings(input.values, target),
          before = layer(input.scope, scopeId, target);
        if (
          target !== "*" &&
          values.model &&
          !["auto", "provider"].includes(values.model) &&
          !catalog.view(agent).models.some((m) => m.id === values.model)
        )
          throw Error("Refresh native models and choose a listed model");
        const revision = JSON.stringify(before);
        if (input.previous !== undefined && input.previous !== revision)
          throw Error("Settings changed in another browser. Reload before saving.");
        if (
          values.access === "edit" &&
          target !== "*" &&
          !capabilities()
            .find((a) => a.id === agent)
            ?.modes.includes("edit")
        )
          throw Error("Editing is outside this agent’s installation policy");
        db.exec("BEGIN");
        try {
          db.prepare(
            "INSERT INTO execution_settings(scope,scope_id,agent,settings,updated) VALUES(?,?,?,?,?) ON CONFLICT(scope,scope_id,agent) DO UPDATE SET settings=excluded.settings,updated=excluded.updated",
          ).run(
            input.scope,
            scopeId,
            target,
            JSON.stringify(values),
            new Date().toISOString(),
          );
          if (target !== "*")
            resolveSettings(
              [
                ...layers(
                  projectId,
                  input.scope === "project" ? null : conversationId,
                  agent,
                ),
                { source: "Validation", values: { access: "edit" } },
              ],
              agent,
              "ask",
              "",
              catalog.view(agent),
            );
          audit("change-execution-settings", null, {
            scope: input.scope,
            id: scopeId,
            agent: target,
            before,
            after: values,
            actor: input.owner ? "browser" : "local",
          });
          refreshPending();
          db.exec("COMMIT");
        } catch (e) {
          db.exec("ROLLBACK");
          throw e;
        }
      }
      return settingsView(
        projectId,
        conversationId,
        agent,
        String(input.mode ?? "ask"),
        String(input.prompt ?? "").slice(0, 16000),
        settings(input.overrides ?? {}, agent, true),
      );
    }

    if (closing) throw new Error("Service is stopping");

    if (typeof input.op === "string" && input.op.startsWith("feedback-"))
      return publicationManager.feedback(input);
    if (input.op === "publication-targets") return publicationManager.targets(input.task);
    if (input.op === "publication-status") {
      return publicationManager.status(input.task);
    }
    if (input.op === "publication-preview") return publicationManager.start(input);
    if (input.op === "publication-approve") return publicationManager.start(input, true);
    if (input.op === "check-setup") return dependencyManager.view(input);
    if (input.op === "check-prepare") return dependencyManager.start(input);
    if (input.op === "check-cancel") return dependencyManager.cancel(input.id);
    if (input.op === "github-status") return github.view(input.owner);
    if (input.op === "github-start") {
      if (blocked("githubChange"))
        throw Error("Wait for the repository or publishing operation.");
      return github.start(input.owner);
    }
    if (input.op === "github-cancel") return github.cancel(input.owner, input.session);
    if (input.op === "github-logout") {
      if (blocked("githubChange"))
        throw Error("Wait for the repository or publishing operation.");
      return github.logout();
    }
    if (input.op === "repository-jobs") return repositoryManager.view();
    if (input.op === "repository-start") return repositoryManager.start(input);
    if (input.op === "repository-cancel") return repositoryManager.cancel(input.job);
    if (input.op === "account-session")
      return { session: accountManager.view(input.owner), busy: accountManager.busy() };
    if (input.op === "account-start" && catalog.busy())
      throw Error("Wait for model discovery before changing accounts");
    if (input.op === "account-start") {
      if (!["login", "logout"].includes(input.action))
        throw Error("Unsupported account action");
      if (blocked("accountChange"))
        throw Error(
          "Wait for current work or account checks to finish before changing accounts.",
        );
      const result = accountManager.start(input.owner, input.adapter, input.action);
      audit("account-" + input.action, null, { adapter: input.adapter });
      return result;
    }
    if (input.op === "account-code")
      return accountManager.submit(input.owner, input.session, input.code);
    if (input.op === "account-cancel")
      return accountManager.cancel(input.owner, input.session);
    if (input.op === "account-refresh") {
      refreshAccounts(true);
      return { ok: true };
    }
    if (input.op === "capabilities") {
      const adapters = capabilities();
      return {
        adapterSchemaVersion: 1,
        adapters,
        editing: adapters.some((value) => value.modes.includes("edit")),
        editAdapters: adapters
          .filter((value) => value.modes.includes("edit"))
          .map((value) => value.id),
        enabledAdapters: adapters
          .filter((value) => value.available)
          .map((value) => value.id),
        strictWorkers: !!c.strictWorkers,
        publishing: true,
        scopedSettings: true,
      };
    }
    if (input.op === "operations") {
      refreshAccounts();
      const counts: Record<string, number> = {
        waiting_for_approval: 0,
        queued: 0,
        running: 0,
        cancelling: 0,
        succeeded: 0,
        failed: 0,
        cancelled: 0,
        timed_out: 0,
        interrupted: 0,
      };
      for (const row of db
        .prepare("SELECT status,count(*) AS count FROM tasks GROUP BY status")
        .all())
        counts[String(row.status)] = Number(row.count);
      const tasks = db
        .prepare(
          `SELECT t.id,t.adapter,t.mode,t.status,t.created,t.updated,t.error,t.review,t.project,t.conversation,
        p.name AS project_name,c.title AS conversation_title,t.checks
        FROM tasks t JOIN projects p ON p.id=t.project JOIN conversations c ON c.id=t.conversation
        ORDER BY t.updated DESC,t.rowid DESC LIMIT 50`,
        )
        .all()
        .map((row: any) => {
          let checkStatus: string | null = null;
          try {
            checkStatus = row.checks
              ? String(JSON.parse(String(row.checks)).status ?? "unknown")
              : null;
          } catch {
            checkStatus = "unknown";
          }
          return {
            id: row.id,
            adapter: row.adapter,
            mode: row.mode,
            status: row.status,
            created: row.created,
            updated: row.updated,
            error: operationError(row.error),
            review: row.review,
            project: row.project,
            projectName: row.project_name,
            conversation: row.conversation,
            conversationTitle: row.conversation_title,
            checkStatus,
          };
        });
      const adapters = capabilities().map((value) => ({
        ...value,
        account: accountCache.get(value.id),
        nativeVersion: versionCache.get(value.id) ?? {
          state: c.command ? "unavailable" : "checking",
          version: null,
          testedVersion: value.nativeLimits.testedVersion,
          checkedAt: null,
        },
        ...(renewalManager ? { renewal: renewalManager.view(value.id) } : {}),
        usage: {
          state: "unavailable",
          message: "Usage limits are not reported by this native CLI",
        },
      }));
      return {
        resources: {
          limits,
          freeBytes: Math.min(...[c.stateDir, c.worktrees, c.logs].map(freeBytes)),
          service: serviceBudget(),
        },
        generatedAt: new Date().toISOString(),
        service: {
          state: "healthy",
          dependencySetup: dependencyManager.busy(),
          scheduler: "serial",
          activeTask: active?.id ?? null,
          queueDepth: counts.queued ?? 0,
          security: c.strictWorkers ? "hardened" : "standard",
          accountChange: accountManager.busy(),
          renewing: !!preparing,
        },
        counts,
        tasks,
        adapters,
      };
    }
    if (input.op === "audit")
      return db.prepare("SELECT * FROM audit ORDER BY id DESC LIMIT 100").all();
    if (input.op === "project-checks") {
      if (dependencyManager.busy() || active)
        throw Error("Wait for checks or dependency preparation.");
      const p = project(input.id);
      if (typeof input.dependencies !== "string" || !isAbsolute(input.dependencies))
        throw Error("Absolute dependency directory required");
      const dependencies = realpathSync(input.dependencies);
      const hash = createHash("sha256")
        .update(readFileSync(join(String(p.repo), "package-lock.json")))
        .digest("hex");
      db.prepare(
        "UPDATE projects SET check_dependencies=?,check_lock=?,check_manifest=NULL WHERE id=?",
      ).run(dependencies, hash, input.id);
      return project(input.id);
    }
    if (input.op === "projects")
      return db
        .prepare(
          `SELECT p.*, (SELECT count(*) FROM conversations c WHERE c.project=p.id AND c.archived=0) AS conversations FROM projects p WHERE p.archived=0 ORDER BY p.created,p.id`,
        )
        .all();
    if (input.op === "project-create" || input.op === "project-register") {
      const name = title(input.name),
        id = randomUUID();
      let repo: string;
      if (input.op === "project-register") {
        if (typeof input.repo !== "string" || !isAbsolute(input.repo))
          throw new Error("Absolute repository path required");
        repo = realpathSync(input.repo);
        if (realpathSync(git(["rev-parse", "--show-toplevel"], repo)) !== repo)
          throw new Error("Repository root mismatch");
        git(["rev-parse", "--verify", "HEAD^{commit}"], repo);
      } else {
        repo = join(c.projectsDir ?? join(c.stateDir, "projects"), id);
        mkdirSync(repo, { recursive: true, mode: 0o700 });
        git(["init", "-b", "main"], repo);
        git(
          [
            "-c",
            "user.name=agentd",
            "-c",
            "user.email=agentd@localhost",
            "commit",
            "--allow-empty",
            "-m",
            "Initialize project",
          ],
          repo,
        );
      }
      auditedWrite(input.op, null, { project: id }, () => {
        db.prepare("INSERT INTO projects(id,name,repo,created) VALUES(?,?,?,?)").run(
          id,
          name,
          repo,
          new Date().toISOString(),
        );
        receipts.save(receipt, id);
      });
      return project(id);
    }
    if (input.op === "project-archive" || input.op === "project-restore") {
      if (dependencyManager.busy() || publicationManager.busy() || projectBusy(input.id))
        throw Error("Wait for the repository or publishing operation.");
      const p = project(input.id),
        archive = input.op === "project-archive";
      if (
        archive &&
        db
          .prepare(
            "SELECT id FROM tasks WHERE project=? AND (status IN ('waiting_for_approval','queued','running','cancelling') OR review='pending') LIMIT 1",
          )
          .get(input.id)
      )
        throw Error(
          "Finish or cancel pending runs and resolve reviews before archiving this project.",
        );
      if (archive && active && get(active.id)?.project === p.id)
        throw Error("Stop the current checks before archiving this project.");
      db.prepare("UPDATE projects SET archived=? WHERE id=?").run(
        archive ? 1 : 0,
        input.id,
      );
      audit(input.op, null, { project: input.id });
      return project(input.id);
    }
    if (input.op === "archived-projects")
      return db
        .prepare("SELECT id,name,created FROM projects WHERE archived=1 ORDER BY name,id")
        .all();
    if (input.op === "history") {
      const query = input.query ?? "",
        filter = input.filter ?? "active",
        before = input.before ?? Number.MAX_SAFE_INTEGER;
      if (
        typeof query !== "string" ||
        query.length > 200 ||
        !["active", "archived", "all"].includes(filter) ||
        !Number.isSafeInteger(before) ||
        before < 1
      )
        throw Error("Invalid history search");
      const rows = db
        .prepare(
          `SELECT c.rowid AS sequence,c.id,c.title,c.project,c.archived,p.name AS projectName,p.archived AS projectArchived,
        (SELECT status FROM tasks t WHERE t.conversation=c.id ORDER BY t.rowid DESC LIMIT 1) AS status,
        (SELECT max(updated) FROM tasks t WHERE t.conversation=c.id) AS updated
        FROM conversations c JOIN projects p ON p.id=c.project WHERE c.rowid<?
        AND (?='all' OR (?='archived' AND (c.archived=1 OR p.archived=1)) OR (?='active' AND c.archived=0 AND p.archived=0))
        AND (?='' OR instr(lower(c.title),lower(?))>0 OR instr(lower(p.name),lower(?))>0
          OR EXISTS(SELECT 1 FROM tasks t WHERE t.conversation=c.id AND instr(lower(t.prompt),lower(?))>0))
        ORDER BY c.rowid DESC LIMIT 51`,
        )
        .all(before, filter, filter, filter, query, query, query, query);
      const more = rows.length > 50;
      return { items: rows.slice(0, 50), next: more ? rows[49].sequence : null };
    }
    if (input.op === "project-rename") {
      project(input.id);
      auditedWrite(input.op, null, { project: input.id }, () =>
        db
          .prepare("UPDATE projects SET name=? WHERE id=?")
          .run(title(input.name), input.id),
      );
      return project(input.id);
    }
    if (input.op === "conversations") {
      project(input.project);
      return db
        .prepare(
          `SELECT c.*, (SELECT status FROM tasks t WHERE t.conversation=c.id ORDER BY created DESC,rowid DESC LIMIT 1) AS status,
        (SELECT adapter FROM tasks t WHERE t.conversation=c.id ORDER BY created DESC,rowid DESC LIMIT 1) AS adapter,
        (SELECT max(created) FROM tasks t WHERE t.conversation=c.id) AS updated
        FROM conversations c WHERE c.project=? AND c.archived=0 ORDER BY updated DESC LIMIT 100`,
        )
        .all(input.project);
    }
    if (input.op === "conversation-show") {
      const thread = conversation(input.id),
        before = input.before ?? Number.MAX_SAFE_INTEGER;
      if (!Number.isSafeInteger(before) || before < 1)
        throw Error("Invalid conversation cursor");
      const rows = db
        .prepare(
          "SELECT rowid AS sequence,* FROM tasks WHERE conversation=? AND rowid<? ORDER BY rowid DESC LIMIT 31",
        )
        .all(input.id, before);
      const more = rows.length > 30,
        page = rows.slice(0, 30).reverse();
      return {
        conversation: thread,
        project: project(String(thread.project)),
        olderBefore: more ? page[0].sequence : null,
        messages: page.map((row) => ({
          ...row,
          answer:
            row.log && existsSync(String(row.log) + ".answer")
              ? logTail(String(row.log) + ".answer", 60000)
              : null,
          answerTruncated:
            !!row.log &&
            existsSync(String(row.log) + ".answer") &&
            statSync(String(row.log) + ".answer").size > 60000,
          output: row.log ? logTail(String(row.log)) : "",
          outputTruncated:
            !!row.log &&
            existsSync(String(row.log)) &&
            statSync(String(row.log)).size > 60000,
          images: JSON.parse(String(row.attachments)).map((id: string) => attachment(id)),
        })),
      };
    }
    if (input.op === "conversation-restore") {
      const thread = conversation(input.id);
      if (project(String(thread.project)).archived)
        throw Error("Restore the project before restoring this conversation.");
      db.prepare("UPDATE conversations SET archived=0 WHERE id=?").run(input.id);
      audit(input.op, null, { conversation: input.id });
      return conversation(input.id);
    }
    if (input.op === "conversation-rename") {
      conversation(input.id);
      auditedWrite(input.op, null, { conversation: input.id }, () =>
        db
          .prepare("UPDATE conversations SET title=? WHERE id=?")
          .run(title(input.name), input.id),
      );
      return conversation(input.id);
    }
    if (input.op === "conversation-archive") {
      conversation(input.id);
      if (
        db
          .prepare(
            "SELECT id FROM tasks WHERE conversation=? AND (status IN ('waiting_for_approval','queued','running','cancelling') OR review='pending')",
          )
          .get(input.id)
      )
        throw new Error("Finish or cancel pending tasks before archiving");
      db.prepare("UPDATE conversations SET archived=1 WHERE id=?").run(input.id);
      audit(input.op, null, { conversation: input.id });
      return { ok: true };
    }
    if (input.op === "list")
      return db.prepare("SELECT * FROM tasks ORDER BY created DESC LIMIT 100").all();
    if (input.op === "create") {
      const mode = input.mode ?? "ask";
      if (!["ask", "edit", "chat"].includes(mode)) throw Error("Invalid task mode");
      requireAdapter(input.adapter, mode);
      const attachments = input.attachments ?? [];
      if (
        !Array.isArray(attachments) ||
        attachments.length > 4 ||
        attachments.some((id) => typeof id !== "string")
      )
        throw new Error("Up to four images allowed");
      if (input.adapter === "cursor" && attachments.length)
        throw Error("Cursor currently accepts text only. Remove images before sending.");
      if (mode === "chat" && attachments.length)
        throw Error("Chat only accepts text. Remove images or choose another agent.");
      attachments.forEach((id) => attachment(id));
      if (input.parent && (typeof input.parent !== "string" || !get(input.parent)))
        throw new Error("Parent task not found");
      if (!adapterIds.includes(input.adapter)) throw new Error("Unsupported adapter");
      if (
        typeof input.prompt !== "string" ||
        !input.prompt.trim() ||
        input.prompt.length > 16000
      )
        throw new Error("Prompt must contain 1 to 16000 characters");
      const prior = input.parent ? get(input.parent) : undefined;
      const threadId = input.conversation ?? prior?.conversation;
      const thread = threadId ? conversation(String(threadId)) : undefined;
      const projectId = input.project ?? thread?.project ?? "default";
      if (projectBusy(projectId))
        throw Error("Wait for the repository update before starting work.");
      const selectedProject = project(projectId);
      if (selectedProject.archived || thread?.archived)
        throw new Error("Workspace is archived");
      if (thread && thread.project !== projectId)
        throw new Error("Conversation belongs to another project");
      if (prior && (prior.project !== projectId || prior.conversation !== threadId))
        throw new Error("Parent belongs to another conversation");
      if (
        thread &&
        db
          .prepare(
            "SELECT id FROM tasks WHERE conversation=? AND status IN ('waiting_for_approval','queued','running','cancelling')",
          )
          .get(String(thread.id))
      )
        throw new Error("Finish or cancel the current turn before sending another");
      const parent =
        prior ??
        (thread
          ? db
              .prepare(
                "SELECT * FROM tasks WHERE conversation=? ORDER BY created DESC,rowid DESC LIMIT 1",
              )
              .get(String(thread.id))
          : undefined);
      if (parent?.seed_tree && !parent.worktree)
        throw Error(
          "Retry the stopped revision request to preserve its saved edits before continuing",
        );
      if (parent?.mode === "edit" && parent.review === "pending")
        throw Error("Commit or discard the preceding changes before continuing");
      const repo = String(selectedProject.repo);
      if (
        realpathSync(git(["rev-parse", "--show-toplevel"], repo)) !== realpathSync(repo)
      )
        throw new Error("Repository root mismatch");
      const revision = parent?.commit_sha
        ? String(parent.commit_sha)
        : parent
          ? String(parent.revision)
          : git(["rev-parse", "--verify", "HEAD^{commit}"], repo);
      const id = randomUUID(),
        at = new Date().toISOString(),
        conversationId = threadId ?? randomUUID();
      db.exec("BEGIN");
      try {
        if (!thread)
          db.prepare(
            "INSERT INTO conversations(id,project,title,created) VALUES(?,?,?,?)",
          ).run(conversationId, projectId, input.prompt.trim().slice(0, 100), at);
        db.prepare(
          "INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,project,conversation,attachments,parent,mode) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          input.adapter,
          input.prompt,
          revision,
          "waiting_for_approval",
          at,
          at,
          projectId,
          conversationId,
          JSON.stringify(attachments),
          parent?.id ?? null,
          mode,
        );
        db.prepare("UPDATE tasks SET run_overrides=? WHERE id=?").run(
          JSON.stringify(settings(input.overrides ?? {}, input.adapter, true)),
          id,
        );
        bindExecution(id);

        db.prepare("INSERT INTO events(task,status,at) VALUES(?,?,?)").run(
          id,
          "waiting_for_approval",
          at,
        );
        audit("create-run", id, {
          project: projectId,
          conversation: conversationId,
          adapter: input.adapter,
          mode,
        });
        receipts.save(receipt, id);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return get(id);
    }
    if (typeof input.id !== "string") throw new Error("Task id required");
    const row = get(input.id);
    if (!row) throw new Error("Task not found");
    if (input.op === "revise") {
      const existing = db.prepare("SELECT * FROM tasks WHERE revision_of=?").get(row.id);
      if (existing) {
        if (existing.prompt !== input.prompt || existing.seed_tree !== input.tree)
          throw Error(
            "A different revision request already exists. Open the latest turn.",
          );
        return existing;
      }
      available(row);
      if (row.review !== "pending") throw Error("Only unresolved changes can be revised");
      if (dependencyManager.busy() || projectBusy(String(row.project)))
        throw Error("Wait for dependency or repository work.");
      if (
        conversation(String(row.conversation)).archived ||
        project(String(row.project)).archived
      )
        throw Error("Workspace is archived");
      if (
        db
          .prepare(
            "SELECT id FROM tasks WHERE conversation=? ORDER BY created DESC,rowid DESC LIMIT 1",
          )
          .get(row.conversation)?.id !== row.id
      )
        throw Error("Only the latest changes can be revised");
      requireAdapter(String(row.adapter), "edit");
      if (
        typeof input.prompt !== "string" ||
        !input.prompt.trim() ||
        input.prompt.length > 16000
      )
        throw Error("Describe the revision in 1 to 16000 characters");
      const value = review(row);
      if (value.tree !== input.tree) throw Error("Changes have changed. Review again.");
      if (value.truncated || value.blocked.length)
        throw Error(
          "Resolve oversized changes or sensitive files or credential content before requesting revisions",
        );
      const id = randomUUID(),
        at = new Date().toISOString();
      // Retain the snapshot against Git garbage collection without creating a commit.
      git(
        ["update-ref", "refs/agentd/revisions/" + id, value.tree],
        String(project(String(row.project)).repo),
      );
      db.exec("BEGIN");
      try {
        db.prepare(
          "INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,project,conversation,attachments,parent,mode,revision_of,seed_tree) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          row.adapter,
          input.prompt,
          row.revision,
          "waiting_for_approval",
          at,
          at,
          row.project,
          row.conversation,
          row.attachments,
          row.id,
          "edit",
          row.id,
          value.tree,
        );
        db.prepare(
          "UPDATE tasks SET merge_parent=?,conflict_paths=?,run_overrides=? WHERE id=?",
        ).run(
          row.merge_parent,
          row.conflict_paths,
          JSON.stringify(settings(input.overrides ?? {}, String(row.adapter), true)),
          id,
        );
        bindExecution(id);
        db.prepare("UPDATE tasks SET review='superseded' WHERE id=?").run(row.id);
        db.prepare("INSERT INTO events(task,status,at) VALUES(?,?,?)").run(
          id,
          "waiting_for_approval",
          at,
        );
        audit("request-revision", id, { revisionOf: row.id, tree: value.tree });
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return get(id);
    }
    if (input.op === "restart-settings") {
      const existing = db.prepare("SELECT * FROM tasks WHERE restart_of=?").get(row.id);
      if (existing) return existing;
      if (
        !["failed", "cancelled", "timed_out", "interrupted"].includes(String(row.status))
      )
        throw Error("Stop the active run before restarting with new settings");
      if (
        db
          .prepare(
            "SELECT id FROM tasks WHERE conversation=? ORDER BY created DESC,rowid DESC LIMIT 1",
          )
          .get(row.conversation)?.id !== row.id
      )
        throw Error("Only the latest run can restart");
      if (
        project(String(row.project)).archived ||
        conversation(String(row.conversation)).archived ||
        row.commit_sha
      )
        throw Error("Workspace is archived or the changes are already committed");
      if (projectBusy(String(row.project)) || dependencyManager.busy() || active)
        throw Error("Wait for active work before restarting");
      let seed = row.seed_tree;
      if (row.mode === "edit" && row.worktree && row.review === "pending") {
        const value = review(row);
        if (value.blocked.length || value.truncated)
          throw Error("Review oversized or sensitive changes before restarting");
        seed = value.tree;
      }
      const id = randomUUID(),
        at = new Date().toISOString();
      if (seed)
        git(
          ["update-ref", "refs/agentd/restarts/" + id, String(seed)],
          String(project(String(row.project)).repo),
        );
      db.exec("BEGIN");
      try {
        db.prepare(
          "INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,project,conversation,attachments,parent,mode,seed_tree,restart_of,merge_parent,conflict_paths) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          row.adapter,
          row.prompt,
          row.revision,
          "waiting_for_approval",
          at,
          at,
          row.project,
          row.conversation,
          row.attachments,
          row.parent,
          row.mode,
          seed ?? null,
          row.id,
          row.merge_parent,
          row.conflict_paths,
        );
        bindExecution(id);
        if (row.review === "pending")
          db.prepare("UPDATE tasks SET review='superseded' WHERE id=?").run(row.id);
        db.prepare("INSERT INTO events(task,status,at) VALUES(?,?,?)").run(
          id,
          "waiting_for_approval",
          at,
        );
        audit("restart-with-settings", id, { original: row.id, seed: seed ?? null });
        db.exec("COMMIT");
      } catch (e) {
        db.exec("ROLLBACK");
        throw e;
      }
      return get(id);
    }
    if (input.op === "retry") {
      if (projectBusy(String(row.project)))
        throw Error("Wait for the repository update.");
      // A repeated HTTP request returns the same attempt, even after a restart.
      const existing = db.prepare("SELECT * FROM tasks WHERE retry_of=?").get(input.id);
      if (existing) return existing;
      if (
        !["failed", "cancelled", "timed_out", "interrupted"].includes(String(row.status))
      )
        throw Error("Only stopped or unsuccessful runs can be retried");
      const thread = conversation(String(row.conversation)),
        p = project(String(row.project));
      if (thread.archived || p.archived) throw Error("Workspace is archived");
      const latest = db
        .prepare(
          "SELECT id FROM tasks WHERE conversation=? ORDER BY created DESC,rowid DESC LIMIT 1",
        )
        .get(row.conversation);
      if (latest?.id !== row.id)
        throw Error("Only the latest run can be retried. Open the latest turn.");
      if (row.review === "pending")
        throw Error(
          "Review and discard the existing changes before retrying. The original worktree will be kept.",
        );
      if (row.commit_sha)
        throw Error("This run has committed changes. Send a follow-up instead.");
      requireAdapter(String(row.adapter), String(row.mode));
      for (const id of JSON.parse(String(row.attachments))) {
        const meta = attachment(id);
        if (!existsSync(join(attachmentRoot, id + meta.ext)))
          throw Error(
            "An original image is missing. Send a new message with the image attached.",
          );
      }
      git(["cat-file", "-e", String(row.revision) + "^{commit}"], String(p.repo));
      const id = randomUUID(),
        at = new Date().toISOString();
      db.exec("BEGIN");
      try {
        // Keep the original context, not the failed attempt's output or partial edits.
        db.prepare(
          "INSERT INTO tasks(id,adapter,prompt,revision,status,created,updated,project,conversation,attachments,parent,mode,retry_of) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
        ).run(
          id,
          row.adapter,
          row.prompt,
          row.revision,
          "waiting_for_approval",
          at,
          at,
          row.project,
          row.conversation,
          row.attachments,
          row.parent,
          row.mode,
          row.id,
        );
        db.prepare(
          "UPDATE tasks SET merge_parent=?,conflict_paths=?,run_overrides=? WHERE id=?",
        ).run(row.merge_parent, row.conflict_paths, row.run_overrides, id);
        bindExecution(id);
        if (row.seed_tree)
          db.prepare("UPDATE tasks SET seed_tree=? WHERE id=?").run(row.seed_tree, id);
        db.prepare("INSERT INTO events(task,status,at) VALUES(?,?,?)").run(
          id,
          "waiting_for_approval",
          at,
        );
        audit("retry-run", id, { retryOf: row.id });
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      return get(id);
    }
    if (input.op === "task-output") {
      const path = row.log ? String(row.log) : null,
        truncated = !!path && existsSync(path) && statSync(path).size > 512000;
      return {
        text:
          (truncated ? "[Earlier output omitted; latest 512 KB follows.]\n" : "") +
          (path ? logTail(path, 512000) : "No output recorded."),
        truncated,
      };
    }
    if (input.op === "review") return review(row);
    if (input.op === "validate") {
      const result = validate(row, input.tree);
      audit("run-checks", input.id, { tree: input.tree });
      return result;
    }
    if (input.op === "discard") {
      available(row);
      if (row.review !== "pending") throw Error("Review is already resolved");
      auditedWrite(input.op, input.id, { project: row.project }, () =>
        db.prepare("UPDATE tasks SET review='discarded' WHERE id=?").run(input.id),
      );
      return get(input.id);
    }
    if (input.op === "commit") {
      const value = review(row);
      if (row.review !== "pending") throw Error("Review is already resolved");
      if (!value.files.length && !row.merge_parent) throw Error("No changes to commit");
      if (value.conflicts.length)
        throw Error("Resolve conflict markers before committing.");
      if (value.tree !== input.tree) throw Error("Changes have changed. Review again.");
      if (value.truncated || value.blocked.length)
        throw Error(
          "Review contains oversized changes or sensitive files or credential content; resolve them before committing",
        );
      if (
        value.checks?.status !== "passed" ||
        value.checks.input !== "git-tree-v1" ||
        value.checks.tree !== value.tree
      )
        throw Error("Checks must pass for the exact reviewed changes");
      const message = title(input.message),
        branch = "agentd/" + row.id;
      audit("approve-commit", input.id, { tree: value.tree, branch });
      const sha = commitSnapshot(
        String(project(String(row.project)).repo),
        String(row.revision),
        value.tree,
        branch,
        message,
        row.merge_parent ? String(row.merge_parent) : undefined,
      );
      db.prepare(
        "UPDATE tasks SET review='committed',commit_sha=?,branch=? WHERE id=?",
      ).run(sha, branch, row.id);
      return get(input.id);
    }
    if (input.op === "show")
      return {
        task: row,
        output: row.log ? logTail(String(row.log)) : "",
        images: JSON.parse(String(row.attachments)).map((id: string) => attachment(id)),
        events: db
          .prepare("SELECT status,at FROM events WHERE task=? ORDER BY id")
          .all(input.id),
      };
    if (input.op === "approve") {
      if (projectBusy(String(row.project)))
        throw Error("Wait for the repository update.");
      if (accountBusy() || catalog.busy() || dependencyManager.busy())
        throw Error(
          "Finish the account change or dependency preparation before approving work",
        );
      if (row.status !== "waiting_for_approval")
        throw new Error("Task is not waiting for approval");
      requireAdapter(String(row.adapter), String(row.mode));
      const approved = execution(row);
      if (
        row.settings_error ||
        !row.execution ||
        approved.fingerprint !== JSON.parse(String(row.execution)).fingerprint
      ) {
        refreshPending();
        throw Error("Settings changed. Review the updated run before approving.");
      }
      if (input.fingerprint !== undefined && input.fingerprint !== approved.fingerprint)
        throw Error("The approval preview is stale. Review the updated settings.");
      audit("approve-run", input.id, {
        adapter: row.adapter,
        mode: row.mode,
        revision: row.revision,
        execution: approved,
      });
      transition(input.id, "queued");
      setImmediate(pump);
      return get(input.id);
    }
    if (input.op === "cancel") {
      audit("cancel", input.id);
      if (active && active.id === input.id) active.stop("cancelled");
      else if (["waiting_for_approval", "queued"].includes(String(row.status)))
        transition(input.id, "cancelled");
      else throw new Error("Task cannot be cancelled in this state");
      return get(input.id);
    }
    throw new Error("Unknown operation");
  }
  refreshPending();
  const socket = join(c.stateDir, "control.sock");
  // systemd RuntimeDirectory supplies a fresh socket directory at every start.
  const server = createServer((connection) => {
    let data = "";
    connection.setTimeout(5000, () => connection.destroy());
    connection.on("error", () => {});
    connection.on("data", (chunk) => {
      data += chunk.toString();
      if (Buffer.byteLength(data) > 80000) {
        connection.destroy();
        return;
      }
      if (!data.includes("\n")) return;
      connection.removeAllListeners("data");
      try {
        connection.end(
          JSON.stringify({ ok: true, result: request(JSON.parse(data.split("\n")[0])) }) +
            "\n",
        );
      } catch (error) {
        connection.end(
          JSON.stringify({ ok: false, error: (error as Error).message }) + "\n",
        );
      }
    });
  });
  // Caller supplies a private, freshly created directory for the control socket.
  const controlPath = process.env.AGENTD_CONTROL_SOCKET ?? socket;
  const gateway = c.gateway ? gatewaySocket(c.gateway, browserRequest) : undefined;
  server.listen(controlPath);
  server.on("listening", () => pump());
  return {
    request,
    server,
    gateway,
    async close() {
      closing = true;
      await publicationManager.close();
      await dependencyManager.close();
      await repositoryManager.close();
      await github.close();
      await catalog.close();
      clearInterval(accountTimer);
      await accountManager.close();
      await renewalManager?.close();
      await preparation;
      const pending = active?.done;
      active?.stop("interrupted");
      if (pending) await pending;
      await gateway?.close();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      db.close();
    },
  };
}
