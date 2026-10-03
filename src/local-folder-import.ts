import { createHash, randomBytes } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  mkdtempSync,
  openSync,
  readSync,
  readdirSync,
  realpathSync,
  rmSync,
  type BigIntStats,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, sep } from "node:path";
import { assertGitConfig, gitEnvironment, gitPolicy } from "./git-policy.ts";
import { scanLimits, sensitiveContent, sensitiveFilename } from "./sensitive-data.ts";

export type LocalFolderCase = "existing_git" | "empty" | "non_git";

export const localFolderLimits = Object.freeze({
  candidates: scanLimits.files,
  fileBytes: scanLimits.blobBytes,
  totalBytes: scanLimits.totalBytes,
  walkEntries: 20000,
  depth: 48,
  ignored: 20000,
  gitOutput: 8 * 1024 * 1024,
  display: 500,
  previewMs: 300000,
});

export const localFolderErrors = Object.freeze({
  path: "Enter an absolute folder path on the AgentD server.",
  pathNotAllowed: "That folder path is not allowed.",
  missing: "That folder was not found or cannot be read.",
  symlink: "Symbolic links are not accepted as project folders.",
  notFolder: "That path is not a folder.",
  protected: "That folder is in a protected location and cannot be used.",
  accountMaterial: "That folder contains account or key material and cannot be imported.",
  noRoots:
    "No local project roots are configured. Ask an administrator to allowlist folder roots.",
  outsideRoots:
    "That folder is outside the configured allowed roots. Ask an administrator to allowlist it.",
  parentRepository:
    "That folder is inside another Git repository. Choose the repository root instead.",
  nested: "Nested Git repositories are not supported for local folder import.",
  bare: "That folder looks like bare Git metadata and cannot be imported.",
  gitSymlink: "That folder has a symbolic-link .git entry and cannot be imported.",
  gitIndirection:
    "That folder contains Git metadata that points elsewhere and cannot be imported.",
  incompleteGit: "That folder has an incomplete Git directory and cannot be imported.",
  noCommit: "That Git repository has no commit yet. Finish setup before registering it.",
  unsafeConfig:
    "That repository's Git configuration can run commands or redirect credentials. Review it before registering.",
  hooks:
    "That repository has active Git hooks. Remove or disable them before registering.",
  unreadable: "That folder contains files that cannot be read safely.",
  specialFiles: "That folder contains special files and cannot be imported.",
  tooManyToInspect: "That folder has too many files to inspect safely.",
  tooMany: "That folder has too many files to import in one step.",
  tooLarge: "That folder is too large to import in one step.",
  changedDuringInspection:
    "That folder changed while it was being inspected. Review it again.",
  changedAfterPreview: "Local folder changed after preview. Review it again.",
  expired: "Local folder preview expired. Review it again.",
  blocked: "Resolve the blocking files listed in the preview before approving.",
});

// Deployment, system and account locations are refused even below an allowed root.
const PROTECTED_PREFIXES = [
  "/etc",
  "/private/etc",
  "/System",
  "/Library",
  "/usr",
  "/bin",
  "/sbin",
  "/lib",
  "/lib64",
  "/root",
  "/var/root",
  "/private/var/root",
  "/var/lib",
  "/var/log",
  "/run",
  "/dev",
  "/proc",
  "/sys",
  "/boot",
  "/srv/agentd",
  "/opt/agentd",
];
const PROTECTED_PREFIX_PATTERNS = [/^\/opt\/agentd-backup-[^/]*(\/|$)/];
// A selected path inside any of these is refused.
const PROFILE_COMPONENTS = [
  [".ssh"],
  [".aws"],
  [".gnupg"],
  [".azure"],
  [".kube"],
  [".docker"],
  [".password-store"],
  [".claude"],
  [".codex"],
  [".cursor"],
  [".agentd"],
  [".config", "gh"],
  [".config", "gcloud"],
  [".config", "cursor"],
  [".config", "agentd"],
  [".local", "share", "agentd"],
  ["Library", "Keychains"],
];
// A selected path containing any of these (for example a home directory) is refused.
const ACCOUNT_MATERIAL = [
  ".ssh",
  ".aws",
  ".gnupg",
  ".azure",
  ".kube",
  ".docker",
  ".password-store",
  ".agentd",
  ".config/gh",
  ".config/gcloud",
  ".config/cursor",
  ".config/agentd",
  ".local/share/agentd",
  "Library/Keychains",
  ".claude.json",
  ".claude/.credentials.json",
  ".codex/auth.json",
  ".cursor/cli-config.json",
  ".netrc",
  ".git-credentials",
];

export type Identity = {
  dev: string;
  ino: string;
  ancestors: [string, string, string][];
};
export type Candidate = {
  path: string;
  mode: "100644" | "100755";
  size: number;
  sha256: string;
  blob: string;
};
export type Refusal = { path: string; reason: string };
export type Finding = { path: string; reasons: string[] };
export type HandoverFile = {
  path: string;
  content: string;
  sha256: string;
  blob: string;
};
export type ExistingState = {
  head: string;
  branch: string | null;
  dirty: boolean;
  statusSha256: string;
  configSha256: string;
};
export type Inspection = {
  canonical: string;
  rootLabel: string;
  pathLabel: string;
  identity: Identity;
  case: LocalFolderCase;
  stack: string[];
  candidates: Candidate[];
  contents: Map<string, Buffer>;
  ignored: string[];
  ignoredSensitive: number;
  refused: Refusal[];
  findings: Finding[];
  handover: HandoverFile[];
  keptHandover: string[];
  createDirs: string[];
  gitOperations: string[];
  willCreateInitialCommit: boolean;
  existing: ExistingState | null;
  blocked: boolean;
  snapshot: string;
};

const fail = (message: string): never => {
  throw Error(message);
};
const sha256 = (value: Buffer | string) =>
  createHash("sha256").update(value).digest("hex");
export const gitBlobId = (value: Buffer) =>
  createHash("sha1").update(`blob ${value.length}\0`).update(value).digest("hex");

export function parseLocalProjectRoots(value: unknown): string[] {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(",")
      : [];
  return list
    .filter((x): x is string => typeof x === "string")
    .map((x) => x.trim())
    .filter((x) => x.length > 0 && isAbsolute(x));
}

function under(root: string, candidate: string) {
  if (root === sep) return true;
  return candidate === root || candidate.startsWith(root + sep);
}

function stat(path: string): BigIntStats | null {
  try {
    return lstatSync(path, { bigint: true });
  } catch {
    return null;
  }
}

function hasComponents(path: string, parts: string[]) {
  const segments = path.split(sep).filter(Boolean);
  for (let i = 0; i + parts.length <= segments.length; i++)
    if (parts.every((part, j) => segments[i + j] === part)) return true;
  return false;
}

export function folderIdentity(canonical: string): Identity {
  const self = stat(canonical);
  if (!self || !self.isDirectory()) fail(localFolderErrors.missing);
  const ancestors: [string, string, string][] = [];
  for (let dir = dirname(canonical); ; dir = dirname(dir)) {
    const info = stat(dir);
    if (!info) fail(localFolderErrors.missing);
    ancestors.push([dir, String(info!.dev), String(info!.ino)]);
    if (dir === dirname(dir)) break;
  }
  return { dev: String(self!.dev), ino: String(self!.ino), ancestors };
}

export function resolveLocalFolderPath(
  inputPath: unknown,
  roots: string[],
  protectedPaths: string[],
) {
  if (typeof inputPath !== "string" || !inputPath.trim()) fail(localFolderErrors.path);
  const raw = (inputPath as string).trim();
  if (!isAbsolute(raw) || raw.length > 4096) fail(localFolderErrors.path);
  if (/[\0\r\n]/.test(raw)) fail(localFolderErrors.pathNotAllowed);
  const first = stat(raw);
  if (!first) fail(localFolderErrors.missing);
  if (first!.isSymbolicLink()) fail(localFolderErrors.symlink);
  if (!first!.isDirectory()) fail(localFolderErrors.notFolder);
  let canonical = "";
  try {
    canonical = realpathSync.native(raw);
  } catch {
    fail(localFolderErrors.missing);
  }
  const resolved = stat(canonical);
  if (!resolved || resolved.isSymbolicLink() || !resolved.isDirectory())
    fail(localFolderErrors.pathNotAllowed);
  if (resolved!.dev !== first!.dev || resolved!.ino !== first!.ino)
    fail(localFolderErrors.changedDuringInspection);
  for (const prefix of PROTECTED_PREFIXES)
    if (under(prefix, canonical) || canonical === sep) fail(localFolderErrors.protected);
  if (PROTECTED_PREFIX_PATTERNS.some((pattern) => pattern.test(canonical)))
    fail(localFolderErrors.protected);
  for (const blocked of protectedPaths) {
    let target = blocked;
    try {
      target = realpathSync.native(blocked);
    } catch {}
    if (under(target, canonical) || under(canonical, target))
      fail(localFolderErrors.protected);
  }
  if (PROFILE_COMPONENTS.some((parts) => hasComponents(canonical, parts)))
    fail(localFolderErrors.protected);
  if (ACCOUNT_MATERIAL.some((rel) => stat(join(canonical, rel))))
    fail(localFolderErrors.accountMaterial);
  const resolvedRoots = roots.flatMap((root) => {
    try {
      const real = realpathSync.native(root);
      return stat(real)?.isDirectory() ? [real] : [];
    } catch {
      return [];
    }
  });
  if (!resolvedRoots.length) fail(localFolderErrors.noRoots);
  const match = resolvedRoots
    .filter((root) => under(root, canonical))
    .sort((a, b) => b.length - a.length)[0];
  if (!match) fail(localFolderErrors.outsideRoots);
  return {
    canonical,
    root: match,
    rootLabel: basename(match) || match,
    pathLabel: relative(match, canonical) || ".",
  };
}

export function detectStackHints(files: string[]) {
  const names = new Set(files.map((f) => f.replace(/\\/g, "/")));
  const hints: string[] = [];
  if (names.has("package.json") || names.has("package-lock.json"))
    hints.push("Node.js / npm");
  if (names.has("pnpm-lock.yaml")) hints.push("pnpm");
  if (names.has("yarn.lock")) hints.push("Yarn");
  if (names.has("Cargo.toml")) hints.push("Rust");
  if (names.has("go.mod")) hints.push("Go");
  if (names.has("pyproject.toml") || names.has("requirements.txt")) hints.push("Python");
  if (names.has("Gemfile")) hints.push("Ruby");
  if (names.has("composer.json")) hints.push("PHP");
  if (names.has("pom.xml") || names.has("build.gradle") || names.has("build.gradle.kts"))
    hints.push("JVM");
  if (names.has("Package.swift")) hints.push("Swift");
  if (names.has("Dockerfile")) hints.push("Docker");
  if ([...names].some((n) => !n.includes("/") && n.endsWith(".csproj")))
    hints.push(".NET");
  return hints;
}

// Inspection never writes: optional locks stop status from refreshing the index.
const inspectEnvironment = (extra: NodeJS.ProcessEnv = {}) => ({
  ...gitEnvironment(),
  GIT_OPTIONAL_LOCKS: "0",
  ...extra,
});

function gitRead(args: string[], env: NodeJS.ProcessEnv, cwd?: string) {
  try {
    return execFileSync("/usr/bin/git", [...gitPolicy, ...args], {
      cwd,
      encoding: "utf8",
      env,
      timeout: 30000,
      maxBuffer: localFolderLimits.gitOutput,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOBUFS")
      fail(localFolderErrors.tooManyToInspect);
    throw error;
  }
}

const nulList = (value: string) => value.split("\0").filter(Boolean);

function looksBare(dir: string) {
  const head = stat(join(dir, "HEAD")),
    objects = stat(join(dir, "objects")),
    refs = stat(join(dir, "refs"));
  return !!(head?.isFile() && objects?.isDirectory() && refs?.isDirectory());
}

function assertRepositoryBoundary(canonical: string, ownGit: boolean) {
  if (!ownGit && looksBare(canonical)) fail(localFolderErrors.bare);
  for (let dir = dirname(canonical); ; dir = dirname(dir)) {
    if (!ownGit && stat(join(dir, ".git"))) fail(localFolderErrors.parentRepository);
    if (!ownGit && looksBare(dir)) fail(localFolderErrors.bare);
    if (dir === dirname(dir)) break;
  }
}

function assertGitDirectory(canonical: string) {
  const gitDir = join(canonical, ".git"),
    info = stat(gitDir)!;
  if (info.isSymbolicLink()) fail(localFolderErrors.gitSymlink);
  if (info.isFile()) fail(localFolderErrors.gitIndirection);
  if (!info.isDirectory()) fail(localFolderErrors.incompleteGit);
  const head = stat(join(gitDir, "HEAD")),
    objects = stat(join(gitDir, "objects")),
    refs = stat(join(gitDir, "refs")),
    config = stat(join(gitDir, "config"));
  if (!head?.isFile() || !objects?.isDirectory() || !refs?.isDirectory())
    fail(localFolderErrors.incompleteGit);
  if (config && (!config.isFile() || config.size > 256n * 1024n))
    fail(localFolderErrors.unsafeConfig);
  if (
    stat(join(gitDir, "commondir")) ||
    stat(join(gitDir, "gitdir")) ||
    stat(join(gitDir, "objects", "info", "alternates")) ||
    stat(join(gitDir, "objects", "info", "http-alternates"))
  )
    fail(localFolderErrors.gitIndirection);
}

// Repository-local configuration that can execute code or redirect credentials or
// transports. AgentD's own policy overrides some at run time; registration still
// refuses them so later direct use cannot inherit them unnoticed.
const UNSAFE_CONFIG = [
  /^include\.path$/,
  /^includeif\..*\.path$/,
  /^core\.(hookspath|sshcommand|gitproxy|askpass|editor|pager|worktree|fsmonitor|attributesfile|excludesfile)$/,
  /^core\.bare$/,
  /^extensions\.worktreeconfig$/,
  /^sequence\.editor$/,
  /^filter\..*\.(clean|smudge|process)$/,
  /^diff\.external$/,
  /^diff\..*\.(command|textconv)$/,
  /^merge\..*\.driver$/,
  /^url\..*\.(insteadof|pushinsteadof)$/,
  /^remote\..*\.(proxy|uploadpack|receivepack|vcs)$/,
  /^http\./,
  /^credential\./,
  /^protocol\./,
  /^gpg\./,
  /^uploadpack\./,
  /^submodule\./,
  /^alias\./,
];
function unsafeRemote(value: string) {
  if (value.includes("::")) return true;
  const url = /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)/i.exec(value);
  if (!url) return /^-/.test(value);
  const scheme = url[1].toLowerCase(),
    authority = url[2];
  if (!["https", "http", "ssh", "git", "file"].includes(scheme)) return true;
  if (!authority.includes("@")) return false;
  const userinfo = authority.slice(0, authority.lastIndexOf("@"));
  return scheme !== "ssh" || userinfo.includes(":");
}

export function vetRepositoryConfiguration(canonical: string) {
  const configPath = join(canonical, ".git", "config");
  if (stat(configPath)) {
    let listed = "";
    try {
      listed = gitRead(
        ["config", "--file", configPath, "--no-includes", "--null", "--list"],
        inspectEnvironment(),
      );
    } catch {
      fail(localFolderErrors.unsafeConfig);
    }
    for (const entry of nulList(listed)) {
      const newline = entry.indexOf("\n"),
        key = (newline < 0 ? entry : entry.slice(0, newline)).toLowerCase(),
        value = newline < 0 ? "" : entry.slice(newline + 1);
      if (key === "core.fsmonitor" && /^(false|0|no|off)$/i.test(value)) continue;
      if (key === "core.bare" && /^(false|0|no|off)$/i.test(value)) continue;
      if (UNSAFE_CONFIG.some((pattern) => pattern.test(key)))
        fail(localFolderErrors.unsafeConfig);
      if (/^remote\..*\.(url|pushurl)$/.test(key) && unsafeRemote(value))
        fail(localFolderErrors.unsafeConfig);
    }
  }
  const hooks = join(canonical, ".git", "hooks"),
    hookInfo = stat(hooks);
  if (hookInfo) {
    if (!hookInfo.isDirectory()) fail(localFolderErrors.hooks);
    for (const name of readdirSync(hooks))
      if (!name.endsWith(".sample")) fail(localFolderErrors.hooks);
  }
  try {
    assertGitConfig(canonical);
  } catch {
    fail(localFolderErrors.unsafeConfig);
  }
}

type Walked = {
  files: Map<string, BigIntStats>;
  refused: Refusal[];
  skipped: Set<string>;
  ignoredNames: string[];
  rootNames: string[];
};

const decoder = new TextDecoder("utf-8", { fatal: true });

/** Walk only non-ignored territory. Entries are never followed; ignored subtrees
 * are not entered, so generated trees cannot exhaust limits or trigger refusals. */
function walk(
  canonical: string,
  ignored: Set<string>,
  mode: "candidates" | "existing",
): Walked {
  const files = new Map<string, BigIntStats>(),
    refused: Refusal[] = [],
    skipped = new Set<string>(),
    ignoredNames: string[] = [],
    rootNames: string[] = [];
  let entries = 0;
  const queue: [string, number][] = [["", 0]];
  while (queue.length) {
    const [dirRel, depth] = queue.shift()!;
    let listing;
    try {
      listing = readdirSync(dirRel ? join(canonical, dirRel) : canonical, {
        withFileTypes: true,
        encoding: "buffer",
      });
    } catch {
      fail(localFolderErrors.unreadable);
    }
    for (const entry of listing!) {
      if (++entries > localFolderLimits.walkEntries)
        fail(localFolderErrors.tooManyToInspect);
      let name: string;
      try {
        name = decoder.decode(entry.name);
      } catch {
        refused.push({ path: displayPath(dirRel, "?"), reason: "unsupported file name" });
        continue;
      }
      if (!dirRel && name === ".git") continue;
      if (!dirRel) rootNames.push(name);
      const rel = dirRel ? `${dirRel}/${name}` : name;
      const info = stat(join(canonical, rel));
      if (!info) fail(localFolderErrors.unreadable);
      if (name === ".git") fail(localFolderErrors.nested);
      if (ignored.has(info!.isDirectory() ? rel + "/" : rel) || ignored.has(rel)) {
        ignoredNames.push(rel);
        continue;
      }
      if (/[\x00-\x1f\x7f]/.test(name)) {
        refused.push({
          path: displayPath(dirRel, name),
          reason: "unsupported file name",
        });
        skipped.add(rel);
        continue;
      }
      if (info!.isDirectory()) {
        if (depth + 1 > localFolderLimits.depth) fail(localFolderErrors.tooManyToInspect);
        queue.push([rel, depth + 1]);
      } else if (info!.isSymbolicLink()) {
        if (mode === "candidates") {
          refused.push({ path: displayPath("", rel), reason: "symbolic link" });
          skipped.add(rel);
        }
      } else if (info!.isFile()) {
        if (mode === "candidates") files.set(rel, info!);
      } else if (mode === "candidates") {
        refused.push({ path: displayPath("", rel), reason: "special file" });
        skipped.add(rel);
      } else fail(localFolderErrors.specialFiles);
    }
  }
  return { files, refused, skipped, ignoredNames, rootNames };
}

export function displayPath(dir: string, name: string) {
  const value = (dir ? `${dir}/${name}` : name).replace(/[\x00-\x1f\x7f]/g, "\uFFFD");
  return value.length > 300 ? value.slice(0, 299) + "…" : value;
}

type Read =
  | { ok: true; candidate: Candidate; content: Buffer; reasons: string[] }
  | { ok: false; reason: string; reasons: string[] };

/** Read one candidate without following links and bind it to its exact bytes. */
export function readCandidate(
  canonical: string,
  rel: string,
  listed?: BigIntStats,
): Read {
  const reasons = sensitiveFilename(rel) ? ["sensitive filename"] : [];
  let fd: number;
  try {
    fd = openSync(
      join(canonical, rel),
      constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
    );
  } catch {
    return { ok: false, reason: "unreadable", reasons };
  }
  try {
    const before = fstatSync(fd, { bigint: true });
    if (!before.isFile()) return { ok: false, reason: "special file", reasons };
    if (listed && (before.dev !== listed.dev || before.ino !== listed.ino))
      return { ok: false, reason: "changed during inspection", reasons };
    if (before.nlink !== 1n) return { ok: false, reason: "hard link", reasons };
    if (before.size > BigInt(localFolderLimits.fileBytes))
      return { ok: false, reason: "too large to scan", reasons };
    const size = Number(before.size);
    if (before.blocks * 512n + 65536n < before.size)
      return { ok: false, reason: "sparse file", reasons };
    const content = Buffer.alloc(size);
    let offset = 0;
    while (offset < size) {
      const n = readSync(fd, content, offset, size - offset, offset);
      if (n === 0) break;
      offset += n;
    }
    const probe = Buffer.alloc(1);
    if (offset !== size || readSync(fd, probe, 0, 1, size) !== 0)
      return { ok: false, reason: "changed during inspection", reasons };
    const after = fstatSync(fd, { bigint: true });
    if (
      after.size !== before.size ||
      after.mtimeNs !== before.mtimeNs ||
      after.ctimeNs !== before.ctimeNs
    )
      return { ok: false, reason: "changed during inspection", reasons };
    let text: string;
    try {
      if (content.includes(0)) throw Error("binary");
      text = decoder.decode(content);
    } catch {
      return { ok: false, reason: "binary content", reasons };
    }
    reasons.push(...sensitiveContent(text));
    return {
      ok: true,
      content,
      reasons: [...new Set(reasons)],
      candidate: {
        path: rel,
        mode: before.mode & 0o100n ? "100755" : "100644",
        size,
        sha256: sha256(content),
        blob: gitBlobId(content),
      },
    };
  } finally {
    closeSync(fd);
  }
}

function listWithTemporaryGit(canonical: string) {
  const gitDir = mkdtempSync(join(tmpdir(), "agentd-local-inspect-"));
  try {
    const env = inspectEnvironment({ GIT_DIR: gitDir, GIT_WORK_TREE: canonical });
    gitRead(["init", "-q", "-b", "main"], env);
    const ignored = nulList(
      gitRead(
        ["ls-files", "-z", "--others", "--ignored", "--exclude-standard", "--directory"],
        env,
      ),
    );
    const listed = nulList(
      gitRead(["ls-files", "-z", "--others", "--exclude-standard"], env),
    );
    return { ignored, listed };
  } finally {
    rmSync(gitDir, { recursive: true, force: true });
  }
}

export function handoverScaffold(input: {
  name: string;
  pathLabel: string;
  rootLabel: string;
  stack: string[];
  folderCase: LocalFolderCase;
}) {
  const stackLine = input.stack.length
    ? input.stack.join(", ")
    : "No common language/tooling manifests detected yet.";
  const agents = `# Agent instructions

This repository is registered with AgentD.

Start with [docs/handover.md](docs/handover.md) before changing behavior.
Preserve approvals, isolation boundaries, and existing project instructions.
`;
  const handover = `# Project handover

## Starting brief

Project **${input.name.replace(/[\r\n]/g, " ")}** was registered from a local folder on the AgentD host
(allowlisted root \`${input.rootLabel}\`, path \`${input.pathLabel}\`).
Detected registration case: \`${input.folderCase}\`.

Continue work through the AgentD desktop/phone GUI. Do not assume SSH or
terminal access is available to the operator.

## Detected stack hints

${stackLine}

Hints come from filenames and manifests only. No model request was used during registration.

## Continue here

1. Open this project in AgentD.
2. Start a conversation for the next task.
3. Keep \`AGENTS.md\` and this file updated when ownership or process changes.
`;
  return { "AGENTS.md": agents, "docs/handover.md": handover } as Record<string, string>;
}

function exactGitOperations(
  folderCase: LocalFolderCase,
  createDirs: string[],
  handover: HandoverFile[],
  files: number,
) {
  if (folderCase === "existing_git")
    return [
      "Register the existing repository in place",
      "No Git command changes the repository, index, branch, remotes or working files",
    ];
  return [
    "git init -q -b main (AgentD-owned .git directory)",
    ...createDirs.map((dir) => `Create directory ${dir}/`),
    ...handover.map((file) => `Create ${file.path} (never overwrites)`),
    `git fast-import: write ${files} approved blob(s) and commit "Initialize local AgentD project" to refs/heads/main`,
    "git read-tree <new commit> (index matches the approved commit; working files untouched)",
    "Register the project",
  ];
}

function snapshotOf(inspection: Omit<Inspection, "snapshot" | "contents">, name: string) {
  return sha256(
    JSON.stringify({
      v: "agentd-local-folder-v2",
      name,
      canonical: inspection.canonical,
      identity: inspection.identity,
      case: inspection.case,
      candidates: inspection.candidates.map((c) => [c.path, c.mode, c.size, c.sha256]),
      ignored: inspection.ignored,
      refused: inspection.refused.map((r) => [r.path, r.reason]),
      findings: inspection.findings.map((f) => [f.path, f.reasons]),
      handover: inspection.handover.map((h) => [h.path, h.sha256]),
      kept: inspection.keptHandover,
      dirs: inspection.createDirs,
      operations: inspection.gitOperations,
      existing: inspection.existing,
    }),
  );
}

export function inspectLocalFolder(input: {
  path: string;
  name: string;
  roots: string[];
  protectedPaths: string[];
}): Inspection {
  const { canonical, rootLabel, pathLabel } = resolveLocalFolderPath(
    input.path,
    input.roots,
    input.protectedPaths,
  );
  const identity = folderIdentity(canonical);
  const gitEntry = stat(join(canonical, ".git"));
  assertRepositoryBoundary(canonical, !!gitEntry);
  let folderCase: LocalFolderCase;
  let existing: ExistingState | null = null;
  let candidates: Candidate[] = [];
  const contents = new Map<string, Buffer>();
  let ignored: string[] = [];
  const refused: Refusal[] = [];
  const findings: Finding[] = [];
  let stack: string[] = [];

  if (gitEntry) {
    assertGitDirectory(canonical);
    folderCase = "existing_git";
    vetRepositoryConfiguration(canonical);
    const env = inspectEnvironment();
    let head = "";
    try {
      head = gitRead(
        ["-C", canonical, "rev-parse", "--verify", "-q", "HEAD^{commit}"],
        env,
      ).trim();
    } catch {
      fail(localFolderErrors.noCommit);
    }
    let branch: string | null = null;
    try {
      branch =
        gitRead(["-C", canonical, "symbolic-ref", "--short", "-q", "HEAD"], env).trim() ||
        null;
    } catch {}
    const status = gitRead(
      [
        "-C",
        canonical,
        "status",
        "--porcelain=v1",
        "-z",
        "--untracked-files=all",
        "--ignore-submodules=none",
      ],
      env,
    );
    ignored = nulList(
      gitRead(
        [
          "-C",
          canonical,
          "ls-files",
          "-z",
          "--others",
          "--ignored",
          "--exclude-standard",
          "--directory",
        ],
        env,
      ),
    );
    if (ignored.length > localFolderLimits.ignored)
      fail(localFolderErrors.tooManyToInspect);
    const walked = walk(canonical, new Set(ignored), "existing");
    stack = detectStackHints(walked.rootNames);
    // Untracked, unignored credentials would be swept up by a later broad commit.
    for (const entry of nulList(status))
      if (entry.startsWith("?? ") && sensitiveFilename(entry.slice(3)))
        findings.push({
          path: displayPath("", entry.slice(3)),
          reasons: ["sensitive untracked file"],
        });
    existing = {
      head,
      branch,
      dirty: status.length > 0,
      statusSha256: sha256(status),
      configSha256: stat(join(canonical, ".git", "config"))
        ? sha256(
            gitRead(
              [
                "config",
                "--file",
                join(canonical, ".git", "config"),
                "--no-includes",
                "--null",
                "--list",
              ],
              env,
            ),
          )
        : sha256(""),
    };
  } else if (!readdirSync(canonical).length) {
    folderCase = "empty";
  } else {
    folderCase = "non_git";
    const listing = listWithTemporaryGit(canonical);
    ignored = listing.ignored;
    if (ignored.length > localFolderLimits.ignored)
      fail(localFolderErrors.tooManyToInspect);
    if (listing.listed.some((entry) => entry.endsWith("/")))
      fail(localFolderErrors.nested);
    const walked = walk(canonical, new Set(ignored), "candidates");
    refused.push(...walked.refused);
    // Git silently omits special files; the walker refuses links, special files and
    // unsupported names. Every other entry must agree exactly.
    const gitFiles = listing.listed
      .filter((p) => !walked.skipped.has(p) && !p.includes("\uFFFD"))
      .sort();
    const walkedFiles = [...walked.files.keys()].sort();
    if (JSON.stringify(gitFiles) !== JSON.stringify(walkedFiles))
      fail(localFolderErrors.changedDuringInspection);
    if (walkedFiles.length > localFolderLimits.candidates)
      fail(localFolderErrors.tooMany);
    let total = 0;
    for (const rel of walkedFiles) {
      const read = readCandidate(canonical, rel, walked.files.get(rel));
      if (read.reasons.length)
        findings.push({ path: displayPath("", rel), reasons: read.reasons });
      if (!read.ok) {
        refused.push({ path: displayPath("", rel), reason: read.reason });
        continue;
      }
      total += read.candidate.size;
      if (total > localFolderLimits.totalBytes) fail(localFolderErrors.tooLarge);
      candidates.push(read.candidate);
      contents.set(rel, read.content);
    }
    for (const rel of walked.skipped)
      if (
        sensitiveFilename(rel) &&
        !findings.some((f) => f.path === displayPath("", rel))
      )
        findings.push({ path: displayPath("", rel), reasons: ["sensitive filename"] });
    stack = detectStackHints(walkedFiles);
  }

  const handover: HandoverFile[] = [],
    keptHandover: string[] = [],
    createDirs: string[] = [];
  if (folderCase !== "existing_git") {
    const scaffold = handoverScaffold({
      name: input.name,
      pathLabel,
      rootLabel,
      stack,
      folderCase,
    });
    for (const [rel, content] of Object.entries(scaffold)) {
      if (stat(join(canonical, rel))) {
        keptHandover.push(rel);
        continue;
      }
      const parent = dirname(rel);
      if (parent !== ".") {
        const parentInfo = stat(join(canonical, parent));
        if (!parentInfo) {
          if (!createDirs.includes(parent)) createDirs.push(parent);
        } else if (parentInfo.isSymbolicLink() || !parentInfo.isDirectory()) {
          refused.push({
            path: parent,
            reason: "handover location is not a plain folder",
          });
          continue;
        }
      }
      const bytes = Buffer.from(content);
      handover.push({
        path: rel,
        content,
        sha256: sha256(bytes),
        blob: gitBlobId(bytes),
      });
    }
    const committed = new Set(candidates.map((c) => c.path));
    for (const file of handover)
      if (committed.has(file.path)) fail(localFolderErrors.changedDuringInspection);
  }
  const ignoredSensitive = ignored.filter((p) =>
    sensitiveFilename(p.replace(/\/$/, "")),
  ).length;
  refused.sort((a, b) => a.path.localeCompare(b.path));
  findings.sort((a, b) => a.path.localeCompare(b.path));
  candidates = candidates.sort((a, b) =>
    a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
  );
  const base = {
    canonical,
    rootLabel,
    pathLabel,
    identity,
    case: folderCase,
    stack,
    candidates,
    ignored: [...ignored].sort(),
    ignoredSensitive,
    refused,
    findings,
    handover,
    keptHandover,
    createDirs,
    gitOperations: exactGitOperations(
      folderCase,
      createDirs,
      handover,
      candidates.length + handover.length,
    ),
    willCreateInitialCommit: folderCase !== "existing_git",
    existing,
    blocked: refused.length > 0 || findings.length > 0,
  };
  return { ...base, contents, snapshot: snapshotOf(base, input.name) };
}

export function previewView(
  inspection: Inspection,
  extra: { fingerprint: string; expiresAt: string; name: string },
) {
  const cap = <T>(items: T[]) => ({
    total: items.length,
    items: items.slice(0, localFolderLimits.display),
    truncated: items.length > localFolderLimits.display,
  });
  const groups = new Map<string, number>();
  for (const entry of inspection.ignored) {
    const top = entry.split("/")[0] + (entry.includes("/") ? "/" : "");
    groups.set(top, (groups.get(top) ?? 0) + 1);
  }
  return {
    ...extra,
    canonicalPath:
      inspection.canonical.length > 1024
        ? inspection.canonical.slice(0, 1023) + "…"
        : inspection.canonical,
    pathLabel: `${inspection.rootLabel}/${inspection.pathLabel}`.replace(/\/\.$/, ""),
    case: inspection.case,
    stack: inspection.stack,
    dirty: inspection.existing?.dirty ?? false,
    branch: inspection.existing?.branch ?? null,
    files: cap(
      inspection.candidates.map((c) => ({
        path: displayPath("", c.path),
        mode: c.mode,
        size: c.size,
      })),
    ),
    ignored: {
      ...cap(inspection.ignored.map((p) => displayPath("", p))),
      groups: [...groups]
        .slice(0, 50)
        .map(([entry, count]) => ({ entry: displayPath("", entry), count })),
      sensitive: inspection.ignoredSensitive,
    },
    refused: cap(inspection.refused),
    findings: cap(inspection.findings),
    handover: inspection.handover.map((h) => ({ path: h.path, content: h.content })),
    keptHandover: inspection.keptHandover,
    gitOperations: inspection.gitOperations,
    willCreateInitialCommit: inspection.willCreateInitialCommit,
    blocked: inspection.blocked,
  };
}

export type PreviewPlan = {
  owner: string;
  fingerprint: string;
  expires: number;
  name: string;
  inspection: Inspection;
};

export function localFolderPlans() {
  const plans = new Map<string, PreviewPlan>();
  const purge = (now = Date.now()) => {
    for (const [owner, plan] of plans) if (plan.expires < now) plans.delete(owner);
  };
  return {
    preview(
      owner: string,
      name: string,
      path: string,
      roots: string[],
      protectedPaths: string[],
    ) {
      purge();
      plans.delete(owner);
      const inspection = inspectLocalFolder({ path, name, roots, protectedPaths });
      const expires = Date.now() + localFolderLimits.previewMs;
      const fingerprint = sha256(
        `agentd-local-folder:${owner}:${inspection.snapshot}:${expires}:${randomBytes(24).toString("hex")}`,
      );
      plans.set(owner, { owner, fingerprint, expires, name, inspection });
      return previewView(inspection, {
        fingerprint,
        expiresAt: new Date(expires).toISOString(),
        name,
      });
    },
    take(owner: string, fingerprint: string) {
      purge();
      const plan = plans.get(owner);
      if (!plan || plan.fingerprint !== fingerprint) fail(localFolderErrors.expired);
      plans.delete(owner);
      return plan!;
    },
    cancel(owner: string) {
      plans.delete(owner);
      return { ok: true };
    },
  };
}
