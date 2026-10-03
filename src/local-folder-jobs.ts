import { type DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  closeSync,
  constants,
  fstatSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  rmSync,
  rmdirSync,
  unlinkSync,
  writeSync,
  type BigIntStats,
} from "node:fs";
import { dirname, join } from "node:path";
import { operationSlot } from "./operation-slot.ts";
import { gitEnvironment, gitPolicy } from "./git-policy.ts";
import {
  folderIdentity,
  inspectLocalFolder,
  localFolderErrors,
  readCandidate,
  type Candidate,
  type ExistingState,
  type HandoverFile,
  type Identity,
  type LocalFolderCase,
  type PreviewPlan,
} from "./local-folder-import.ts";

export const localFolderJobErrors = Object.freeze({
  busy: "Wait for the current operation before importing a local folder.",
  stopping: "Service is stopping. Try again after it restarts.",
  notFound: "Local folder import not found.",
  notRunning: "That local folder import is no longer running.",
  cancelled: "Local folder import cancelled. AgentD changes were rolled back.",
  failed: "Local folder import failed. AgentD changes were rolled back.",
  interrupted: "Service stopped during local folder import. Resume or roll back.",
  restarted: "Service restarted before registration finished. Review the folder again.",
  partial: "Local folder rollback left changes it could not verify. Review the folder.",
  identity: "The local folder was replaced or moved during import. Review the folder.",
  foreignGit:
    "The folder now has Git metadata that AgentD did not create. Review the folder.",
  duplicate: "That folder is already registered as a project.",
  pendingDeletion: "That folder belongs to a project pending deletion.",
  needsRecovery:
    "A previous import of that folder needs recovery. Resume it or roll it back first.",
  notRecoverable: "This local folder import does not need recovery.",
  recoveryAction: "Choose resume or roll back.",
});

export const localFolderPhases = Object.freeze({
  existing_git: ["approved", "registered"],
  empty: ["approved", "git_initialized", "handover_created", "committed", "registered"],
  non_git: ["approved", "git_initialized", "handover_created", "committed", "registered"],
});

type Owned = {
  gitIntent: boolean;
  git: { dev: string; ino: string } | null;
  dirs: string[];
  files: { path: string; sha256: string }[];
  commit: string | null;
};
type JobPlan = {
  v: 2;
  canonical: string;
  rootLabel: string;
  pathLabel: string;
  name: string;
  case: LocalFolderCase;
  identity: Identity;
  snapshot: string;
  candidates: Candidate[];
  handover: HandoverFile[];
  createDirs: string[];
  existing: ExistingState | null;
  project: string;
  owned: Owned;
};
type Options = {
  db: DatabaseSync;
  roots: () => string[];
  protectedPaths: () => string[];
  closing: () => boolean;
  blocked: () => boolean;
  audit: (action: string, task: string | null, detail: unknown) => void;
  /** Test seam: returning true stops work as if the process died after a phase. */
  interrupt?: (phase: string, job: string) => boolean | Promise<boolean>;
};

class JobError extends Error {}
const now = () => new Date().toISOString();
const sha256 = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");
const statOf = (path: string): BigIntStats | null => {
  try {
    return lstatSync(path, { bigint: true });
  } catch {
    return null;
  }
};

function git(cwd: string, args: string[], signal?: AbortSignal, input?: Buffer) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("/usr/bin/git", [...gitPolicy, "-C", cwd, ...args], {
      env: gitEnvironment(),
      stdio: ["pipe", "pipe", "pipe"],
      signal,
      timeout: 60000,
    });
    const out: Buffer[] = [];
    let size = 0;
    child.stdout.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 4 * 1024 * 1024) child.kill("SIGKILL");
      else out.push(chunk);
    });
    child.stderr.resume();
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(out).toString("utf8"))
        : reject(Object.assign(Error("Git command failed"), { status: code })),
    );
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}

// fast-import accepts C-style quoted paths; quote every byte outside printable ASCII.
function quotePath(path: string) {
  let out = '"';
  for (const byte of Buffer.from(path)) {
    if (byte === 0x22) out += '\\"';
    else if (byte === 0x5c) out += "\\\\";
    else if (byte < 0x20 || byte >= 0x7f) out += "\\" + byte.toString(8).padStart(3, "0");
    else out += String.fromCharCode(byte);
  }
  return out + '"';
}

type Entry = { path: string; mode: string; blob: string; content: Buffer };
function fastImportStream(entries: Entry[]) {
  const parts: Buffer[] = [];
  entries.forEach((entry, i) =>
    parts.push(
      Buffer.from(`blob\nmark :${i + 1}\ndata ${entry.content.length}\n`),
      entry.content,
      Buffer.from("\n"),
    ),
  );
  const at = Math.floor(Date.now() / 1000),
    message = "Initialize local AgentD project\n",
    who = `AgentD <agentd@localhost> ${at} +0000`;
  parts.push(
    Buffer.from(
      `commit refs/heads/main\nmark :${entries.length + 1}\nauthor ${who}\ncommitter ${who}\ndata ${Buffer.byteLength(message)}\n${message}`,
    ),
  );
  entries.forEach((entry, i) =>
    parts.push(Buffer.from(`M ${entry.mode} :${i + 1} ${quotePath(entry.path)}\n`)),
  );
  parts.push(Buffer.from("\ndone\n"));
  return Buffer.concat(parts);
}

async function treeMatches(cwd: string, commit: string, expected: Entry[]) {
  const listed = (await git(cwd, ["ls-tree", "-r", "-z", "--full-tree", commit]))
    .split("\0")
    .filter(Boolean)
    .map((line) => {
      const tab = line.indexOf("\t"),
        [mode, type, blob] = line.slice(0, tab).split(" ");
      return `${mode} ${type} ${blob} ${line.slice(tab + 1)}`;
    })
    .sort();
  const want = expected.map((e) => `${e.mode} blob ${e.blob} ${e.path}`).sort();
  return JSON.stringify(listed) === JSON.stringify(want);
}

// An AgentD-initialized repository that crashed before its identity was journaled
// contains no objects or refs, so removing it cannot lose user data.
function freshRepository(gitDir: string) {
  if (statOf(join(gitDir, "packed-refs"))) return false;
  const anyFile = (dir: string): boolean => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return true;
    }
    return entries.some((e) => (e.isDirectory() ? anyFile(join(dir, e.name)) : true));
  };
  const head = statOf(join(gitDir, "HEAD"));
  if (!head?.isFile()) return false;
  return (
    readFileSync(join(gitDir, "HEAD"), "utf8") === "ref: refs/heads/main\n" &&
    !anyFile(join(gitDir, "objects")) &&
    !anyFile(join(gitDir, "refs"))
  );
}

function writeExclusive(path: string, content: string) {
  const fd = openSync(
    path,
    constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW,
    0o644,
  );
  try {
    const bytes = Buffer.from(content);
    let offset = 0;
    while (offset < bytes.length) offset += writeSync(fd, bytes, offset);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}

export function localFolderJobs(o: Options) {
  const db = o.db,
    slot = operationSlot("local-folder"),
    E = localFolderJobErrors;
  const load = (id: string) =>
    db.prepare("SELECT * FROM local_folder_jobs WHERE id=?").get(id) as any;
  const save = (
    id: string,
    patch: {
      state?: string;
      phase?: string;
      plan?: JobPlan;
      error?: string | null;
      project?: string;
    },
  ) => {
    const current = load(id);
    db.prepare(
      "UPDATE local_folder_jobs SET state=?,phase=?,plan=?,error=?,project=?,updated=? WHERE id=?",
    ).run(
      patch.state ?? current.state,
      patch.phase ?? current.phase,
      patch.plan ? JSON.stringify(patch.plan) : current.plan,
      patch.error === undefined ? current.error : patch.error,
      patch.project ?? current.project,
      now(),
      id,
    );
  };
  // A running job at startup may already have mutated the folder.
  for (const job of db
    .prepare("SELECT id,plan FROM local_folder_jobs WHERE state='running'")
    .all() as any[]) {
    const mutating = JSON.parse(String(job.plan)).case !== "existing_git";
    save(String(job.id), {
      state: mutating ? "recovery_required" : "failed",
      error: mutating ? E.interrupted : E.restarted,
    });
  }

  const view = (row: any) => {
    const plan = JSON.parse(String(row.plan)) as JobPlan,
      phases = localFolderPhases[plan.case],
      reached = phases.indexOf(row.phase);
    return {
      id: row.id,
      state: row.state,
      phase: row.phase,
      case: plan.case,
      name: plan.name,
      pathLabel: `${plan.rootLabel}/${plan.pathLabel}`.replace(/\/\.$/, ""),
      project: row.state === "succeeded" ? row.project : null,
      error: row.error,
      created: row.created,
      updated: row.updated,
      phases: phases.map((phase, i) => ({ phase, done: i <= reached })),
      running: row.state === "running",
      canCancel: row.state === "running" && slot.view()?.id === row.id,
      needsRecovery: row.state === "recovery_required",
    };
  };
  const list = () =>
    (
      db
        .prepare(
          "SELECT * FROM local_folder_jobs ORDER BY updated DESC,rowid DESC LIMIT 10",
        )
        .all() as any[]
    ).map(view);

  function admit() {
    if (o.closing()) throw Error(E.stopping);
    if (o.blocked() || slot.busy()) throw Error(E.busy);
  }

  function verifyIdentity(plan: JobPlan, fd?: number) {
    let current: Identity;
    try {
      current = folderIdentity(plan.canonical);
    } catch {
      throw new JobError(E.identity);
    }
    if (JSON.stringify(current) !== JSON.stringify(plan.identity))
      throw new JobError(E.identity);
    if (fd !== undefined) {
      const held = fstatSync(fd, { bigint: true });
      if (
        String(held.dev) !== plan.identity.dev ||
        String(held.ino) !== plan.identity.ino
      )
        throw new JobError(E.identity);
    }
  }

  function rollback(plan: JobPlan, persist: () => void) {
    try {
      verifyIdentity(plan);
    } catch {
      return false;
    }
    let complete = true;
    for (const file of [...plan.owned.files].reverse()) {
      const full = join(plan.canonical, file.path),
        info = statOf(full);
      if (info) {
        if (!info.isFile() || sha256(readFileSync(full)) !== file.sha256) {
          complete = false;
          continue;
        }
        unlinkSync(full);
      }
      plan.owned.files = plan.owned.files.filter((f) => f.path !== file.path);
      persist();
    }
    for (const dir of [...plan.owned.dirs].reverse()) {
      try {
        rmdirSync(join(plan.canonical, dir));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          complete = false;
          continue;
        }
      }
      plan.owned.dirs = plan.owned.dirs.filter((d) => d !== dir);
      persist();
    }
    const gitDir = join(plan.canonical, ".git"),
      info = statOf(gitDir);
    if (info && (plan.owned.git || plan.owned.gitIntent)) {
      const ours =
        info.isDirectory() &&
        String(info.dev) === plan.identity.dev &&
        (plan.owned.git
          ? String(info.ino) === plan.owned.git.ino
          : freshRepository(gitDir));
      if (ours) {
        rmSync(gitDir, { recursive: true, force: true });
        plan.owned.git = null;
        plan.owned.gitIntent = false;
        plan.owned.commit = null;
        persist();
      } else complete = false;
    } else if (!info) {
      plan.owned.git = null;
      plan.owned.gitIntent = false;
      plan.owned.commit = null;
      persist();
    }
    return complete;
  }

  function register(id: string, plan: JobPlan) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const duplicate = db
        .prepare("SELECT deleted_at FROM projects WHERE repo=?")
        .get(plan.canonical) as any;
      if (duplicate)
        throw new JobError(duplicate.deleted_at ? E.pendingDeletion : E.duplicate);
      db.prepare("INSERT INTO projects(id,name,repo,created) VALUES(?,?,?,?)").run(
        plan.project,
        plan.name,
        plan.canonical,
        now(),
      );
      save(id, {
        state: "succeeded",
        phase: "registered",
        project: plan.project,
        error: null,
        plan,
      });
      o.audit("local-folder-import", null, {
        job: id,
        project: plan.project,
        case: plan.case,
        outcome: "registered",
      });
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  async function run(
    id: string,
    mode: "apply" | "resume" | "rollback",
    signal: AbortSignal,
  ) {
    const plan = JSON.parse(String(load(id).plan)) as JobPlan;
    const persist = (phase?: string) => save(id, { plan, ...(phase ? { phase } : {}) });
    const halted = async (phase: string) => !!(await o.interrupt?.(phase, id));
    let fd: number | undefined;
    try {
      if (mode === "rollback") {
        const complete = rollback(plan, persist);
        save(id, {
          state: complete ? "rolled_back" : "recovery_required",
          error: complete ? null : E.partial,
          plan,
        });
        o.audit("local-folder-import", null, {
          job: id,
          case: plan.case,
          outcome: complete ? "rolled-back" : "rollback-incomplete",
        });
        return;
      }
      if (mode === "apply") {
        const fresh = inspectLocalFolder({
          path: plan.canonical,
          name: plan.name,
          roots: o.roots(),
          protectedPaths: o.protectedPaths(),
        });
        if (fresh.snapshot !== plan.snapshot || fresh.blocked)
          throw new JobError(localFolderErrors.changedAfterPreview);
      }
      if (signal.aborted) throw new JobError(E.cancelled);
      if (plan.case === "existing_git") {
        verifyIdentity(plan);
        register(id, plan);
        return;
      }
      try {
        fd = openSync(
          plan.canonical,
          constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
        );
      } catch {
        throw new JobError(E.identity);
      }
      const guard = () => {
        if (signal.aborted) throw new JobError(E.cancelled);
        verifyIdentity(plan, fd);
      };

      // Phase: git_initialized
      guard();
      const gitDir = join(plan.canonical, ".git");
      let gitInfo = statOf(gitDir);
      if (!gitInfo) {
        plan.owned.gitIntent = true;
        plan.owned.git = null;
        persist();
        await git(plan.canonical, ["init", "-q", "-b", "main"], signal);
        gitInfo = statOf(gitDir);
        if (!gitInfo?.isDirectory() || String(gitInfo.dev) !== plan.identity.dev)
          throw new JobError(E.identity);
        plan.owned.git = { dev: String(gitInfo.dev), ino: String(gitInfo.ino) };
      } else if (
        !gitInfo.isDirectory() ||
        !(plan.owned.git
          ? String(gitInfo.ino) === plan.owned.git.ino
          : plan.owned.gitIntent && freshRepository(gitDir))
      )
        throw new JobError(E.foreignGit);
      else plan.owned.git = { dev: String(gitInfo.dev), ino: String(gitInfo.ino) };
      persist("git_initialized");
      if (await halted("git_initialized")) return;

      // Phase: handover_created. Never overwrite: creation is exclusive and no-follow.
      for (const dir of plan.createDirs) {
        guard();
        const full = join(plan.canonical, dir),
          info = statOf(full);
        if (!info) {
          if (!plan.owned.dirs.includes(dir)) plan.owned.dirs.push(dir);
          persist();
          mkdirSync(full, { mode: 0o755 });
        } else if (
          !plan.owned.dirs.includes(dir) ||
          info.isSymbolicLink() ||
          !info.isDirectory()
        )
          throw new JobError(localFolderErrors.changedAfterPreview);
        const made = statOf(full);
        if (!made?.isDirectory() || String(made.dev) !== plan.identity.dev)
          throw new JobError(E.identity);
      }
      for (const file of plan.handover) {
        guard();
        const full = join(plan.canonical, file.path),
          parent = statOf(dirname(full)),
          info = statOf(full),
          owned = plan.owned.files.some((f) => f.path === file.path);
        if (!parent?.isDirectory() || String(parent.dev) !== plan.identity.dev)
          throw new JobError(E.identity);
        if (!info) {
          if (!owned) plan.owned.files.push({ path: file.path, sha256: file.sha256 });
          persist();
          writeExclusive(full, file.content);
        } else if (!owned || !info.isFile() || sha256(readFileSync(full)) !== file.sha256)
          throw new JobError(localFolderErrors.changedAfterPreview);
      }
      persist("handover_created");
      if (await halted("handover_created")) return;

      // Phase: committed. The commit is written from bytes re-verified against the
      // approved digests, not from whatever the working tree holds at staging time.
      guard();
      const entries: Entry[] = [];
      for (const candidate of plan.candidates) {
        const read = readCandidate(plan.canonical, candidate.path);
        if (
          !read.ok ||
          read.reasons.length ||
          read.candidate.sha256 !== candidate.sha256 ||
          read.candidate.mode !== candidate.mode
        )
          throw new JobError(localFolderErrors.changedAfterPreview);
        entries.push({ ...candidate, content: read.content });
      }
      for (const file of plan.handover) {
        const content = readFileSync(join(plan.canonical, file.path));
        if (sha256(content) !== file.sha256)
          throw new JobError(localFolderErrors.changedAfterPreview);
        entries.push({ path: file.path, mode: "100644", blob: file.blob, content });
      }
      let head = "";
      try {
        head = (
          await git(
            plan.canonical,
            ["rev-parse", "--verify", "-q", "refs/heads/main^{commit}"],
            signal,
          )
        ).trim();
      } catch {}
      guard();
      if (!head) {
        await git(
          plan.canonical,
          ["fast-import", "--quiet", "--done", "--date-format=raw"],
          signal,
          fastImportStream(entries),
        );
        head = (
          await git(
            plan.canonical,
            ["rev-parse", "--verify", "refs/heads/main^{commit}"],
            signal,
          )
        ).trim();
      } else if (
        plan.owned.commit !== head &&
        !(await treeMatches(plan.canonical, head, entries))
      )
        throw new JobError(E.foreignGit);
      if (!(await treeMatches(plan.canonical, head, entries)))
        throw new JobError(E.failed);
      plan.owned.commit = head;
      persist();
      guard();
      await git(plan.canonical, ["read-tree", head], signal);
      persist("committed");
      if (await halted("committed")) return;

      // Phase: registered (atomic with job success).
      guard();
      register(id, plan);
    } catch (error) {
      const cancelled = signal.aborted;
      const complete = plan.case === "existing_git" ? true : rollback(plan, persist);
      const message = !complete
        ? E.partial
        : cancelled
          ? E.cancelled
          : error instanceof JobError
            ? error.message
            : E.failed;
      save(id, {
        state: !complete ? "recovery_required" : cancelled ? "cancelled" : "failed",
        error: message,
        plan,
      });
      o.audit("local-folder-import", null, {
        job: id,
        case: plan.case,
        outcome: !complete ? "recovery-required" : cancelled ? "cancelled" : "failed",
        error: message,
      });
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  }

  const start = (id: string, mode: "apply" | "resume" | "rollback") =>
    slot.start(id, (signal) => run(id, mode, signal));
  // A folder with unfinished AgentD changes must be recovered before it is re-inspected.
  function assertNoRecovery(canonical: string) {
    for (const row of db
      .prepare(
        "SELECT plan FROM local_folder_jobs WHERE state IN ('recovery_required','running')",
      )
      .all() as any[])
      if (JSON.parse(String(row.plan)).canonical === canonical)
        throw Error(E.needsRecovery);
  }

  return {
    busy: slot.busy,
    assertNoRecovery,
    view: list,
    job(id: string) {
      const row = load(String(id ?? ""));
      if (!row) throw Error(E.notFound);
      return view(row);
    },
    /** Idempotent: a repeated approval returns the job created by the first one. */
    existing(fingerprint: string, owner: string) {
      const row = db
        .prepare("SELECT * FROM local_folder_jobs WHERE fingerprint=? AND owner=?")
        .get(fingerprint, owner);
      return row ? view(row) : null;
    },
    approve(preview: PreviewPlan, owner: string) {
      const inspection = preview.inspection;
      if (inspection.blocked) throw Error(localFolderErrors.blocked);
      admit();
      const duplicate = db
        .prepare("SELECT deleted_at FROM projects WHERE repo=?")
        .get(inspection.canonical) as any;
      if (duplicate) throw Error(duplicate.deleted_at ? E.pendingDeletion : E.duplicate);
      assertNoRecovery(inspection.canonical);
      const id = randomUUID(),
        plan: JobPlan = {
          v: 2,
          canonical: inspection.canonical,
          rootLabel: inspection.rootLabel,
          pathLabel: inspection.pathLabel,
          name: preview.name,
          case: inspection.case,
          identity: inspection.identity,
          snapshot: inspection.snapshot,
          candidates: inspection.candidates,
          handover: inspection.handover,
          createDirs: inspection.createDirs,
          existing: inspection.existing,
          project: randomUUID(),
          owned: { gitIntent: false, git: null, dirs: [], files: [], commit: null },
        };
      const at = now();
      db.prepare(
        "INSERT INTO local_folder_jobs(id,owner,fingerprint,state,phase,project,plan,error,created,updated) VALUES(?,?,?,?,?,?,?,?,?,?)",
      ).run(
        id,
        owner,
        preview.fingerprint,
        "running",
        "approved",
        null,
        JSON.stringify(plan),
        null,
        at,
        at,
      );
      o.audit("local-folder-approve", null, { job: id, case: plan.case });
      void start(id, "apply");
      return view(load(id));
    },
    cancel(id: string, owner: string) {
      const row = load(String(id ?? ""));
      if (!row || row.owner !== owner) throw Error(E.notFound);
      if (!slot.cancel(row.id)) throw Error(E.notRunning);
      return view(load(row.id));
    },
    recover(id: string, action: unknown) {
      if (action !== "resume" && action !== "rollback") throw Error(E.recoveryAction);
      const row = load(String(id ?? ""));
      if (!row) throw Error(E.notFound);
      if (row.state !== "recovery_required") throw Error(E.notRecoverable);
      admit();
      save(row.id, { state: "running", error: null });
      o.audit("local-folder-recover", null, { job: row.id, action });
      void start(row.id, action);
      return view(load(row.id));
    },
    close: slot.close,
  };
}
