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
  mkdtempSync,
  openSync,
  readSync,
  readdirSync,
  readlinkSync,
  rmSync,
  rmdirSync,
  unlinkSync,
  writeSync,
  type BigIntStats,
} from "node:fs";
import { tmpdir } from "node:os";
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
  busy: "Wait for the current local folder import to finish.",
  gitChanged:
    "Git metadata changed after the interruption. AgentD left the repository and files for manual recovery.",
  treeChanged:
    "Working files changed before registration. AgentD rolled back its changes; review the folder and import again.",
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
  /** Digest of the complete .git tree after AgentD's latest Git step. */
  gitState?: string | null;
  /** Device and inode of each committed path at its final content read. */
  read?: Record<string, [string, string]>;
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
  /** The public message for conflicting work, or null when the import may start. */
  blocked: () => string | null;
  /** Called when an import or recovery releases its slot. */
  settled?: () => void;
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

function git(
  cwd: string,
  args: string[],
  signal?: AbortSignal,
  input?: Buffer,
  env: NodeJS.ProcessEnv = {},
) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn("/usr/bin/git", [...gitPolicy, "-C", cwd, ...args], {
      env: { ...gitEnvironment(), ...env },
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

function readNoFollow(path: string, max = 1024 * 1024): Buffer | null {
  let fd: number;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  } catch {
    return null;
  }
  try {
    const info = fstatSync(fd);
    if (!info.isFile() || info.size > max) return null;
    const content = Buffer.alloc(info.size);
    let offset = 0;
    while (offset < content.length) {
      const n = readSync(fd, content, offset, content.length - offset, offset);
      if (n === 0) break;
      offset += n;
    }
    return offset === content.length ? content : null;
  } finally {
    closeSync(fd);
  }
}

const gitTreeLimits = { entries: 50000, bytes: 64 * 1024 * 1024 };
/** Digest of every entry under .git: path, type, permission bits and exact content or
 * link target. Any added or changed ref, object, reflog, HEAD, index, config or hook
 * changes it. Null means the tree could not be read completely within bounds. */
export function gitTreeDigest(gitDir: string): string | null {
  const hash = createHash("sha256");
  let entries = 0,
    bytes = 0;
  const visit = (rel: string): boolean => {
    let names: string[];
    try {
      names = readdirSync(join(gitDir, rel)).sort();
    } catch {
      return false;
    }
    for (const name of names) {
      const child = rel ? `${rel}/${name}` : name,
        full = join(gitDir, child),
        info = statOf(full);
      if (!info || ++entries > gitTreeLimits.entries) return false;
      const perm = (info.mode & 0o7777n).toString(8);
      if (info.isDirectory()) {
        hash.update(`d\0${child}\0${perm}\n`);
        if (!visit(child)) return false;
      } else if (info.isFile()) {
        bytes += Number(info.size);
        if (bytes > gitTreeLimits.bytes) return false;
        const content = readNoFollow(full, gitTreeLimits.bytes);
        if (!content) return false;
        hash.update(`f\0${child}\0${perm}\0${content.length}\0${sha256(content)}\n`);
      } else if (info.isSymbolicLink())
        hash.update(`l\0${child}\0${readlinkSync(full)}\n`);
      else return false;
    }
    return true;
  };
  return visit("") ? hash.digest("hex") : null;
}

// The exact tree `git init` produces here, for a crash after init but before its
// digest was journaled. Any difference means the metadata is not provably AgentD's.
async function pristineGitDigest(signal?: AbortSignal) {
  const dir = mkdtempSync(join(tmpdir(), "agentd-git-pristine-"));
  try {
    await git(dir, ["init", "-q", "-b", "main"], signal);
    return gitTreeDigest(join(dir, ".git"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
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
    if (slot.busy()) throw Error(E.busy);
    const conflict = o.blocked();
    if (conflict) throw Error(conflict);
  }

  /** Refuse unless .git is exactly what AgentD's last journaled Git step produced. */
  async function verifyGit(plan: JobPlan, signal?: AbortSignal) {
    const gitDir = join(plan.canonical, ".git"),
      info = statOf(gitDir);
    if (
      !info?.isDirectory() ||
      String(info.dev) !== plan.identity.dev ||
      (plan.owned.git && String(info.ino) !== plan.owned.git.ino)
    )
      throw new JobError(E.gitChanged);
    const expected =
      plan.owned.gitState ??
      (plan.owned.gitIntent ? await pristineGitDigest(signal) : null);
    const current = gitTreeDigest(gitDir);
    if (!expected || !current || current !== expected) throw new JobError(E.gitChanged);
  }
  const recordGit = (plan: JobPlan) => {
    plan.owned.gitState = gitTreeDigest(join(plan.canonical, ".git"));
    if (!plan.owned.gitState) throw new JobError(E.gitChanged);
  };

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

  /** Undo only provably AgentD-owned changes. Returns null when complete, otherwise
   * the public reason the folder was left for manual recovery. */
  async function rollback(plan: JobPlan, persist: () => void): Promise<string | null> {
    try {
      verifyIdentity(plan);
    } catch {
      return E.partial;
    }
    const gitDir = join(plan.canonical, ".git"),
      info = statOf(gitDir),
      ownsGit = !!(plan.owned.git || plan.owned.gitIntent);
    // Verify Git first: if anything changed there, touch neither .git nor any file.
    if (info && ownsGit) {
      try {
        await verifyGit(plan);
      } catch {
        return E.gitChanged;
      }
    }
    let complete = true;
    for (const file of [...plan.owned.files].reverse()) {
      const full = join(plan.canonical, file.path),
        present = statOf(full);
      if (present) {
        const content = readNoFollow(full);
        if (!content || sha256(content) !== file.sha256) {
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
    if (!complete || (info && !ownsGit)) return E.partial;
    if (info) {
      // Re-check immediately before removal; the file steps above took time.
      try {
        await verifyGit(plan);
      } catch {
        return E.gitChanged;
      }
      rmSync(gitDir, { recursive: true, force: true });
    }
    plan.owned.git = null;
    plan.owned.gitIntent = false;
    plan.owned.gitState = null;
    plan.owned.commit = null;
    persist();
    return null;
  }

  /** Immediately before registration, the working tree must still be exactly the
   * approved, committed content, read without following links. */
  async function verifyWorkingTree(plan: JobPlan, fd: number, signal: AbortSignal) {
    verifyIdentity(plan, fd);
    const expected = [
      ...plan.candidates.map((c) => ({ path: c.path, mode: c.mode, sha256: c.sha256 })),
      ...plan.handover.map((h) => ({ path: h.path, mode: "100644", sha256: h.sha256 })),
    ];
    for (const entry of expected) {
      const seen = plan.owned.read?.[entry.path];
      const read = readCandidate(
        plan.canonical,
        entry.path,
        seen
          ? ({ dev: BigInt(seen[0]), ino: BigInt(seen[1]) } as BigIntStats)
          : undefined,
      );
      if (
        !read.ok ||
        read.candidate.sha256 !== entry.sha256 ||
        read.candidate.mode !== entry.mode
      )
        throw new JobError(E.treeChanged);
    }
    await verifyGit(plan, signal);
    const head = (
      await git(plan.canonical, ["rev-parse", "--verify", "HEAD^{commit}"], signal)
    ).trim();
    if (head !== plan.owned.commit) throw new JobError(E.gitChanged);
    // No optional locks: status must not refresh (write) the index while checking.
    const status = await git(
      plan.canonical,
      [
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
        "--ignore-submodules=none",
      ],
      signal,
      undefined,
      { GIT_OPTIONAL_LOCKS: "0" },
    );
    if (status) throw new JobError(E.treeChanged);
    await verifyGit(plan, signal);
    verifyIdentity(plan, fd);
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
        const refused = await rollback(plan, persist);
        save(id, {
          state: refused ? "recovery_required" : "rolled_back",
          error: refused,
          plan,
        });
        o.audit("local-folder-import", null, {
          job: id,
          case: plan.case,
          outcome: refused ? "rollback-refused" : "rolled-back",
          ...(refused ? { error: refused } : {}),
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
        plan.owned.gitState = null;
        persist();
        await git(plan.canonical, ["init", "-q", "-b", "main"], signal);
        gitInfo = statOf(gitDir);
        if (!gitInfo?.isDirectory() || String(gitInfo.dev) !== plan.identity.dev)
          throw new JobError(E.identity);
        plan.owned.git = { dev: String(gitInfo.dev), ino: String(gitInfo.ino) };
        recordGit(plan);
      } else if (!plan.owned.git && !plan.owned.gitIntent)
        throw new JobError(E.foreignGit);
      else {
        // Resuming: the existing .git must be exactly what AgentD last journaled.
        await verifyGit(plan, signal);
        plan.owned.git = { dev: String(gitInfo.dev), ino: String(gitInfo.ino) };
        recordGit(plan);
      }
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
        } else {
          const content = owned ? readNoFollow(full) : null;
          if (!content || sha256(content) !== file.sha256)
            throw new JobError(localFolderErrors.changedAfterPreview);
        }
      }
      persist("handover_created");
      if (await halted("handover_created")) return;

      // Phase: committed. The commit is written from bytes re-verified against the
      // approved digests, not from whatever the working tree holds at staging time.
      guard();
      await verifyGit(plan, signal);
      const entries: Entry[] = [],
        identities: Record<string, [string, string]> = {};
      for (const candidate of plan.candidates) {
        const read = readCandidate(plan.canonical, candidate.path);
        if (
          !read.ok ||
          read.reasons.length ||
          read.candidate.sha256 !== candidate.sha256 ||
          read.candidate.mode !== candidate.mode
        )
          throw new JobError(localFolderErrors.changedAfterPreview);
        identities[candidate.path] = read.identity;
        entries.push({ ...candidate, content: read.content });
      }
      for (const file of plan.handover) {
        const read = readCandidate(plan.canonical, file.path);
        if (!read.ok || read.candidate.sha256 !== file.sha256)
          throw new JobError(localFolderErrors.changedAfterPreview);
        identities[file.path] = read.identity;
        entries.push({
          path: file.path,
          mode: "100644",
          blob: file.blob,
          content: read.content,
        });
      }
      plan.owned.read = identities;
      persist();
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
      recordGit(plan);
      persist();
      guard();
      await git(plan.canonical, ["read-tree", head], signal);
      recordGit(plan);
      persist("committed");
      if (await halted("committed")) return;

      // Phase: registered (atomic with job success), only after the working tree is
      // proven to be exactly the committed tree.
      guard();
      await verifyWorkingTree(plan, fd, signal);
      register(id, plan);
    } catch (error) {
      const cancelled = signal.aborted;
      const refused = plan.case === "existing_git" ? null : await rollback(plan, persist);
      const message =
        refused ??
        (cancelled ? E.cancelled : error instanceof JobError ? error.message : E.failed);
      save(id, {
        state: refused ? "recovery_required" : cancelled ? "cancelled" : "failed",
        error: message,
        plan,
      });
      o.audit("local-folder-import", null, {
        job: id,
        case: plan.case,
        outcome: refused ? "recovery-required" : cancelled ? "cancelled" : "failed",
        error: message,
      });
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  }

  const start = (id: string, mode: "apply" | "resume" | "rollback") =>
    slot.start(id, (signal) => run(id, mode, signal), o.settled);
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
