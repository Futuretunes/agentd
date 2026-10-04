import { type DatabaseSync } from "node:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import {
  closeSync,
  constants,
  fstatSync,
  mkdtempSync,
  openSync,
  rmSync,
  type BigIntStats,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  UnsafePath,
  createFileAt,
  directoryRelativeSupported,
  idOf,
  lstatAt,
  mkdirAt,
  openChain,
  openDirAt,
  openRoot,
  readFileAt,
  readdirAt,
  readlinkAt,
  reopen,
  rmdirAt,
  unlinkAt,
  type FileId,
} from "./directory-handles.ts";
import { operationSlot } from "./operation-slot.ts";
import { gitEnvironment, gitPolicy } from "./git-policy.ts";
import {
  folderIdentity,
  gitBlobId,
  inspectLocalFolder,
  localFolderErrors,
  localFolderLimits,
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
  unsafePath:
    "A folder on a path AgentD uses was replaced or became a link. AgentD left the files for manual recovery.",
  unsupported:
    "This server cannot change local folders safely: directory-relative file operations need Linux. Nothing was changed.",
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
  /** Created files; `id` is the device and inode returned by the exclusive create. */
  files: { path: string; sha256: string; id?: FileId }[];
  /** Device and inode of every directory on a handover path, created or pre-existing,
   * journaled before anything is written inside it. */
  dirIds?: Record<string, FileId>;
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
  /** Test seam: extra generated files, including nested paths, appended at approval. */
  extraHandover?: { path: string; content: string }[];
};

class JobError extends Error {}
const now = () => new Date().toISOString();
const sha256 = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");
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

const gitTreeLimits = { entries: 50000, bytes: 64 * 1024 * 1024 };
type Manifest = Map<string, { type: "d" | "f" | "l"; ino: string }>;
const kind = (info: BigIntStats) =>
  info.isDirectory() ? "d" : info.isFile() ? "f" : info.isSymbolicLink() ? "l" : null;

/** Digest of every entry under a held .git directory: path, type, permission bits and
 * exact content or link target, walked through verified directory handles on one
 * device. Any added or changed ref, object, reflog, HEAD, index, config or hook
 * changes it. The manifest binds each digested path to its inode. Null means the tree
 * could not be read completely within bounds. */
function digestGitDir(dir: number, dev: string) {
  const hash = createHash("sha256"),
    manifest: Manifest = new Map();
  let entries = 0,
    bytes = 0;
  const visit = (fd: number, rel: string): boolean => {
    for (const name of readdirAt(fd)) {
      const child = rel ? `${rel}/${name}` : name,
        info = lstatAt(fd, name),
        type = info && kind(info);
      if (!info || !type || String(info.dev) !== dev || ++entries > gitTreeLimits.entries)
        return false;
      const perm = (info.mode & 0o7777n).toString(8);
      manifest.set(child, { type, ino: String(info.ino) });
      if (type === "d") {
        hash.update(`d\0${child}\0${perm}\n`);
        const sub = openDirAt(fd, name, dev, String(info.ino));
        try {
          if (!visit(sub, child)) return false;
        } finally {
          closeSync(sub);
        }
      } else if (type === "f") {
        bytes += Number(info.size);
        if (bytes > gitTreeLimits.bytes) return false;
        const read = readFileAt(fd, name, gitTreeLimits.bytes, idOf(info));
        if (!read) return false;
        hash.update(
          `f\0${child}\0${perm}\0${read.content.length}\0${sha256(read.content)}\n`,
        );
      } else hash.update(`l\0${child}\0${readlinkAt(fd, name)}\n`);
    }
    return true;
  };
  try {
    return visit(dir, "") ? { digest: hash.digest("hex"), manifest } : null;
  } catch {
    return null;
  }
}

/** The digest of a .git directory, or null when it cannot be read safely. */
export function gitTreeDigest(gitDir: string): string | null {
  if (!directoryRelativeSupported()) return null;
  let fd: number;
  try {
    fd = openSync(
      gitDir,
      constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW,
    );
  } catch {
    return null;
  }
  try {
    return digestGitDir(fd, String(fstatSync(fd, { bigint: true }).dev))?.digest ?? null;
  } finally {
    closeSync(fd);
  }
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

/** Remove a verified .git tree entry by entry through directory handles. Every entry
 * must still be the digested inode of the same type; anything else stops removal. */
function removeGitDir(
  parent: number,
  name: string,
  rel: string,
  ino: string,
  dev: string,
  manifest: Manifest,
) {
  const fd = openDirAt(parent, name, dev, ino);
  try {
    for (const child of readdirAt(fd)) {
      const path = rel ? `${rel}/${child}` : child,
        info = lstatAt(fd, child),
        want = manifest.get(path);
      if (!info || !want || kind(info) !== want.type || String(info.ino) !== want.ino)
        throw new UnsafePath("git changed");
      if (want.type === "d") removeGitDir(fd, child, path, want.ino, dev, manifest);
      else unlinkAt(fd, child, idOf(info));
    }
  } finally {
    closeSync(fd);
  }
  rmdirAt(parent, name, [dev, ino]);
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

  const fileLimit = localFolderLimits.fileBytes;
  const rootId = (plan: JobPlan): FileId => [plan.identity.dev, plan.identity.ino];
  const expectedGit = async (plan: JobPlan, signal?: AbortSignal) =>
    plan.owned.gitState ??
    (plan.owned.gitIntent ? await pristineGitDigest(signal) : null);

  /** Refuse unless .git is exactly what AgentD's last journaled Git step produced.
   * Synchronous, so a destructive step can follow it without yielding. */
  function checkGit(plan: JobPlan, root: number, expected: string | null): Manifest {
    let fd: number;
    try {
      fd = openDirAt(root, ".git", plan.identity.dev, plan.owned.git?.ino);
    } catch {
      throw new JobError(E.gitChanged);
    }
    try {
      const current = digestGitDir(fd, plan.identity.dev);
      if (!expected || !current || current.digest !== expected)
        throw new JobError(E.gitChanged);
      return current.manifest;
    } finally {
      closeSync(fd);
    }
  }
  const verifyGit = async (plan: JobPlan, root: number, signal?: AbortSignal) =>
    checkGit(plan, root, await expectedGit(plan, signal));
  function recordGit(plan: JobPlan, root: number) {
    let fd: number;
    try {
      fd = openDirAt(root, ".git", plan.identity.dev, plan.owned.git?.ino);
    } catch {
      throw new JobError(E.gitChanged);
    }
    try {
      plan.owned.gitState = digestGitDir(fd, plan.identity.dev)?.digest ?? null;
    } finally {
      closeSync(fd);
    }
    if (!plan.owned.gitState) throw new JobError(E.gitChanged);
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

  /** The verified directory holding `rel`, walked from the held root one component at a
   * time. With `strict`, every component must already have a journaled identity. */
  function parentOf(plan: JobPlan, root: number, rel: string, strict: boolean) {
    const parts = rel.split("/"),
      name = parts.pop()!;
    const ids = plan.owned.dirIds ?? {};
    if (strict && parts.some((_, i) => !ids[parts.slice(0, i + 1).join("/")]))
      throw new UnsafePath("unjournaled directory");
    return { dir: openChain(root, parts, plan.identity.dev, (p) => ids[p]), name };
  }
  function readAt(
    plan: JobPlan,
    root: number,
    rel: string,
    strict: boolean,
    id?: FileId,
  ) {
    let held;
    try {
      held = parentOf(plan, root, rel, strict);
    } catch {
      return null;
    }
    try {
      return readFileAt(held.dir, held.name, fileLimit, id);
    } finally {
      closeSync(held.dir);
    }
  }

  /** Undo only provably AgentD-owned changes, through verified directory handles.
   * Returns null when complete, otherwise the public reason the folder was left for
   * manual recovery. */
  async function rollback(
    plan: JobPlan,
    persist: () => void,
    held?: number,
  ): Promise<string | null> {
    const owned = plan.owned,
      ownsGit = !!(owned.git || owned.gitIntent);
    if (!directoryRelativeSupported())
      return ownsGit || owned.files.length || owned.dirs.length ? E.unsupported : null;
    let root: number;
    try {
      root = held !== undefined ? reopen(held) : openRoot(plan.canonical, rootId(plan));
    } catch {
      return E.partial;
    }
    try {
      try {
        verifyIdentity(plan, root);
      } catch {
        return E.partial;
      }
      const gitInfo = lstatAt(root, ".git");
      const expected = gitInfo && ownsGit ? await expectedGit(plan) : null;
      // Verify Git first: if anything changed there, touch neither .git nor any file.
      if (gitInfo && ownsGit) {
        try {
          checkGit(plan, root, expected);
        } catch {
          return E.gitChanged;
        }
      }
      // Everything AgentD would remove is verified before anything is removed, and each
      // item is verified again, through fresh handles, immediately before its removal.
      // This block never yields, so no other AgentD step runs in between.
      const removeFile = (file: Owned["files"][number], apply: boolean) => {
        const { dir, name } = parentOf(plan, root, file.path, true);
        try {
          if (!lstatAt(dir, name)) return;
          const read = file.id ? readFileAt(dir, name, fileLimit, file.id) : null;
          if (!read || sha256(read.content) !== file.sha256)
            throw new UnsafePath("file changed");
          if (apply) unlinkAt(dir, name, file.id!);
        } finally {
          closeSync(dir);
        }
      };
      const removeDir = (path: string, apply: boolean) => {
        const { dir, name } = parentOf(plan, root, path, true);
        try {
          const info = lstatAt(dir, name),
            id = owned.dirIds?.[path];
          if (!info) return;
          if (!id) throw new UnsafePath("unjournaled directory");
          const held = openDirAt(dir, name, plan.identity.dev, id[1]);
          try {
            // Only entries AgentD itself will remove first may remain inside.
            for (const child of readdirAt(held)) {
              const rel = `${path}/${child}`;
              if (
                apply ||
                !(owned.files.some((f) => f.path === rel) || owned.dirs.includes(rel))
              )
                throw new UnsafePath("directory not empty");
            }
          } finally {
            closeSync(held);
          }
          if (apply) rmdirAt(dir, name, id);
        } finally {
          closeSync(dir);
        }
      };
      if (gitInfo && !ownsGit) return E.partial;
      const files = [...owned.files].reverse(),
        dirs = [...owned.dirs].reverse();
      try {
        for (const file of files) removeFile(file, false);
        for (const path of dirs) removeDir(path, false);
      } catch {
        return E.partial;
      }
      for (const file of files) {
        try {
          removeFile(file, true);
        } catch {
          return E.partial;
        }
        owned.files = owned.files.filter((f) => f.path !== file.path);
        persist();
      }
      for (const path of dirs) {
        try {
          removeDir(path, true);
        } catch {
          return E.partial;
        }
        owned.dirs = owned.dirs.filter((d) => d !== path);
        if (owned.dirIds) delete owned.dirIds[path];
        persist();
      }
      if (gitInfo) {
        // Re-verify and remove without yielding: the file steps above took time.
        try {
          const manifest = checkGit(plan, root, expected);
          removeGitDir(
            root,
            ".git",
            "",
            String(gitInfo.ino),
            plan.identity.dev,
            manifest,
          );
        } catch {
          return E.gitChanged;
        }
      }
      owned.git = null;
      owned.gitIntent = false;
      owned.gitState = null;
      owned.commit = null;
      persist();
      return null;
    } finally {
      closeSync(root);
    }
  }

  /** Immediately before registration, the working tree must still be exactly the
   * approved, committed content, read through verified directory handles. */
  async function verifyWorkingTree(plan: JobPlan, fd: number, signal: AbortSignal) {
    verifyIdentity(plan, fd);
    const expected = [
      ...plan.candidates.map((c) => ({ ...c, strict: false })),
      ...plan.handover.map((h) => ({ ...h, mode: "100644", strict: true })),
    ];
    for (const entry of expected) {
      const id = plan.owned.read?.[entry.path];
      const read = id ? readAt(plan, fd, entry.path, entry.strict, id) : null;
      if (!read || sha256(read.content) !== entry.sha256 || read.mode !== entry.mode)
        throw new JobError(E.treeChanged);
    }
    await verifyGit(plan, fd, signal);
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
    await verifyGit(plan, fd, signal);
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
      if (!directoryRelativeSupported()) throw new JobError(E.unsupported);
      try {
        fd = openRoot(plan.canonical, rootId(plan));
      } catch {
        throw new JobError(E.identity);
      }
      const root = fd;
      const guard = () => {
        if (signal.aborted) throw new JobError(E.cancelled);
        verifyIdentity(plan, root);
      };
      const record = (rel: string, id: FileId) => {
        if (plan.owned.dirIds?.[rel]) return;
        plan.owned.dirIds = { ...plan.owned.dirIds, [rel]: id };
        persist();
      };
      const parent = (rel: string) => {
        const parts = rel.split("/"),
          name = parts.pop()!;
        try {
          const dir = openChain(
            root,
            parts,
            plan.identity.dev,
            (p) => plan.owned.dirIds?.[p],
            record,
          );
          return { dir, name };
        } catch {
          throw new JobError(E.unsafePath);
        }
      };

      // Phase: git_initialized
      guard();
      const gitInfo = lstatAt(root, ".git");
      if (!gitInfo) {
        plan.owned.gitIntent = true;
        plan.owned.git = null;
        plan.owned.gitState = null;
        persist();
        await git(plan.canonical, ["init", "-q", "-b", "main"], signal);
        let made: number;
        try {
          made = openDirAt(root, ".git", plan.identity.dev);
        } catch {
          throw new JobError(E.identity);
        }
        const [dev, ino] = idOf(fstatSync(made, { bigint: true }));
        closeSync(made);
        plan.owned.git = { dev, ino };
        recordGit(plan, root);
      } else if (!plan.owned.git && !plan.owned.gitIntent)
        throw new JobError(E.foreignGit);
      else {
        // Resuming: the existing .git must be exactly what AgentD last journaled.
        await verifyGit(plan, root, signal);
        plan.owned.git = { dev: String(gitInfo.dev), ino: String(gitInfo.ino) };
        recordGit(plan, root);
      }
      persist("git_initialized");
      if (await halted("git_initialized")) return;

      // Phase: handover_created. Every directory on a handover path is opened from the
      // held root without following links and journaled before anything is written in
      // it; creation is exclusive and acts on one name inside a verified handle.
      const depth = (rel: string) => rel.split("/").length;
      for (const path of [...plan.createDirs].sort((x, y) => depth(x) - depth(y))) {
        guard();
        const { dir, name } = parent(path);
        try {
          const info = lstatAt(dir, name);
          if (!info) {
            if (!plan.owned.dirs.includes(path)) plan.owned.dirs.push(path);
            persist();
            mkdirAt(dir, name);
          } else if (!plan.owned.dirs.includes(path))
            throw new JobError(localFolderErrors.changedAfterPreview);
          else if (!plan.owned.dirIds?.[path]) throw new JobError(E.unsafePath);
          let made: number;
          try {
            made = openDirAt(
              dir,
              name,
              plan.identity.dev,
              plan.owned.dirIds?.[path]?.[1],
            );
          } catch {
            throw new JobError(E.unsafePath);
          }
          record(path, idOf(fstatSync(made, { bigint: true })));
          closeSync(made);
        } finally {
          closeSync(dir);
        }
      }
      for (const file of plan.handover) {
        guard();
        const { dir, name } = parent(file.path);
        try {
          // Test seam: the parent chain is verified and held; nothing is written yet.
          if (await halted(`handover_write:${file.path}`)) return;
          // The held directory must still be the one the path reaches from the root, so a
          // replaced or moved parent never receives the write.
          guard();
          const again = parent(file.path);
          const same =
            fstatSync(again.dir, { bigint: true }).ino ===
            fstatSync(dir, { bigint: true }).ino;
          closeSync(again.dir);
          if (!same) throw new JobError(E.unsafePath);
          const info = lstatAt(dir, name),
            entry = plan.owned.files.find((f) => f.path === file.path);
          if (!info) {
            const created = entry ?? { path: file.path, sha256: file.sha256 };
            if (!entry) plan.owned.files.push(created);
            persist();
            created.id = createFileAt(dir, name, file.content);
            persist();
          } else {
            const read = entry?.id ? readFileAt(dir, name, fileLimit, entry.id) : null;
            if (!read || sha256(read.content) !== file.sha256)
              throw new JobError(localFolderErrors.changedAfterPreview);
          }
        } finally {
          closeSync(dir);
        }
      }
      persist("handover_created");
      if (await halted("handover_created")) return;

      // Phase: committed. The commit is written from bytes re-verified against the
      // approved digests, not from whatever the working tree holds at staging time.
      guard();
      await verifyGit(plan, root, signal);
      const entries: Entry[] = [],
        identities: Record<string, [string, string]> = {};
      for (const candidate of plan.candidates) {
        const read = readAt(plan, root, candidate.path, false);
        if (
          !read ||
          read.content.length !== candidate.size ||
          sha256(read.content) !== candidate.sha256 ||
          read.mode !== candidate.mode
        )
          throw new JobError(localFolderErrors.changedAfterPreview);
        identities[candidate.path] = read.id;
        entries.push({ ...candidate, content: read.content });
      }
      for (const file of plan.handover) {
        const created = plan.owned.files.find((f) => f.path === file.path);
        const read = created?.id ? readAt(plan, root, file.path, true, created.id) : null;
        if (!read || sha256(read.content) !== file.sha256)
          throw new JobError(localFolderErrors.changedAfterPreview);
        identities[file.path] = read.id;
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
      recordGit(plan, root);
      persist();
      guard();
      await git(plan.canonical, ["read-tree", head], signal);
      recordGit(plan, root);
      persist("committed");
      if (await halted("committed")) return;

      // Phase: registered (atomic with job success), only after the working tree is
      // proven to be exactly the committed tree.
      guard();
      await verifyWorkingTree(plan, fd, signal);
      register(id, plan);
    } catch (error) {
      const cancelled = signal.aborted;
      const refused =
        plan.case === "existing_git" ? null : await rollback(plan, persist, fd);
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
      if (inspection.case !== "existing_git" && !directoryRelativeSupported())
        throw Error(E.unsupported);
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
      for (const extra of o.extraHandover ?? []) {
        if (plan.handover.some((file) => file.path === extra.path)) continue;
        const bytes = Buffer.from(extra.content);
        plan.handover.push({
          path: extra.path,
          content: extra.content,
          sha256: sha256(bytes),
          blob: gitBlobId(bytes),
        });
        const parts = extra.path.split("/").slice(0, -1);
        for (let i = 1; i <= parts.length; i++) {
          const parent = parts.slice(0, i).join("/");
          if (parent && !plan.createDirs.includes(parent)) plan.createDirs.push(parent);
        }
      }
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
      if (!directoryRelativeSupported()) throw Error(E.unsupported);
      admit();
      save(row.id, { state: "running", error: null });
      o.audit("local-folder-recover", null, { job: row.id, action });
      void start(row.id, action);
      return view(load(row.id));
    },
    close: slot.close,
  };
}
