import { createHash, randomBytes, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  unlinkSync,
  writeFileSync,
  mkdtempSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { gitEnvironment, gitPolicy, localGit } from "./git-policy.ts";
import { sensitiveContent, sensitiveFilename, scanLimits } from "./sensitive-data.ts";

export type LocalFolderCase = "existing_git" | "empty" | "non_git";

export type LocalFolderPreview = {
  fingerprint: string;
  expiresAt: string;
  name: string;
  path: string;
  pathLabel: string;
  case: LocalFolderCase;
  stack: string[];
  dirty: boolean;
  branch: string | null;
  filesToAdd: string[];
  ignoredOrExcluded: string[];
  sensitiveFindings: Array<{ path: string; reasons: string[] }>;
  handoverToCreate: string[];
  gitOperations: string[];
  willCreateInitialCommit: boolean;
  refused: string[];
};

type Plan = LocalFolderPreview & {
  owner: string;
  expires: number;
  snapshot: string;
  canonical: string;
  rootLabel: string;
};

const MAX_FILES = 2000;
const MAX_FILE_BYTES = scanLimits.blobBytes;
const MAX_TOTAL_BYTES = scanLimits.totalBytes;
const PREVIEW_MS = 300000;

const PROTECTED_PREFIXES = [
  "/etc",
  "/private/etc",
  "/System",
  "/usr",
  "/bin",
  "/sbin",
  "/var/root",
  "/root",
  "/dev",
  "/proc",
  "/sys",
  "/boot",
  "/opt/agentd",
  "/opt/agentd-backup-",
];

export function parseLocalProjectRoots(value: unknown): string[] {
  if (Array.isArray(value))
    return value.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  if (typeof value === "string")
    return value
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  return [];
}

function under(root: string, candidate: string) {
  const prefix = root.endsWith(sep) ? root : root + sep;
  return candidate === root || candidate.startsWith(prefix);
}

function publicPathError(message: string): never {
  throw Error(message);
}

export function resolveLocalFolderPath(
  inputPath: unknown,
  roots: string[],
  protectedPaths: string[],
) {
  if (typeof inputPath !== "string" || !inputPath.trim())
    publicPathError("Enter an absolute folder path on the AgentD server.");
  const raw = inputPath.trim();
  if (!isAbsolute(raw))
    publicPathError("Enter an absolute folder path on the AgentD server.");
  if (raw.includes("\0")) publicPathError("That folder path is not allowed.");
  let st;
  try {
    st = lstatSync(raw);
  } catch {
    publicPathError("That folder was not found or cannot be read.");
  }
  if (st.isSymbolicLink())
    publicPathError("Symbolic links are not accepted as project folders.");
  if (!st.isDirectory()) publicPathError("That path is not a folder.");
  let canonical: string;
  try {
    canonical = realpathSync(raw);
  } catch {
    publicPathError("That folder was not found or cannot be read.");
  }
  const canonStat = lstatSync(canonical);
  if (canonStat.isSymbolicLink() || !canonStat.isDirectory())
    publicPathError("That folder path is not allowed.");
  for (const blocked of protectedPaths) {
    let target = blocked;
    try {
      target = realpathSync(blocked);
    } catch {
      target = resolve(blocked);
    }
    if (under(target, canonical) || under(canonical, target))
      publicPathError("That folder is in a protected location and cannot be used.");
  }
  for (const prefix of PROTECTED_PREFIXES)
    if (canonical === prefix || canonical.startsWith(prefix + sep))
      publicPathError("That folder is in a protected location and cannot be used.");
  const resolvedRoots = roots
    .map((root) => {
      try {
        return { root, canonical: realpathSync(root) };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as Array<{ root: string; canonical: string }>;
  if (!resolvedRoots.length)
    publicPathError(
      "No local project roots are configured. Ask an administrator to allowlist folder roots.",
    );
  const match = resolvedRoots.find((root) => under(root.canonical, canonical));
  if (!match)
    publicPathError(
      "That folder is outside the configured allowed roots. Ask an administrator to allowlist it.",
    );
  return {
    canonical,
    rootLabel: basename(match!.canonical) || match!.canonical,
    pathLabel: relative(match!.canonical, canonical) || ".",
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
  if ([...names].some((n) => n.endsWith(".csproj"))) hints.push(".NET");
  return hints;
}

function gitEnv(gitDir: string, workTree: string): NodeJS.ProcessEnv {
  return {
    ...gitEnvironment(),
    GIT_DIR: gitDir,
    GIT_WORK_TREE: workTree,
  };
}

function gitSeparate(
  gitDir: string,
  workTree: string,
  args: string[],
  options: { maxBuffer?: number } = {},
) {
  return execFileSync("/usr/bin/git", [...gitPolicy, ...args], {
    encoding: "utf8",
    env: gitEnv(gitDir, workTree),
    timeout: 30000,
    maxBuffer: options.maxBuffer ?? 8 * 1024 * 1024,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function isGitRoot(path: string) {
  try {
    const top = localGit(path, ["rev-parse", "--show-toplevel"]);
    return realpathSync(top) === path;
  } catch {
    return false;
  }
}

function hasHead(path: string) {
  try {
    localGit(path, ["rev-parse", "--verify", "HEAD^{commit}"]);
    return true;
  } catch {
    return false;
  }
}

function nestedGitRepos(root: string) {
  const found: string[] = [];
  const walk = (dir: string, depth: number) => {
    if (found.length || depth > 8) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.name === ".git") continue;
      const full = join(dir, entry.name);
      let st;
      try {
        st = lstatSync(full);
      } catch {
        continue;
      }
      if (st.isSymbolicLink()) continue;
      if (st.isDirectory()) {
        if (existsSync(join(full, ".git"))) found.push(relative(root, full) || ".");
        else walk(full, depth + 1);
      }
    }
  };
  walk(root, 0);
  return found;
}

function listDirectoryFiles(root: string) {
  const files: string[] = [];
  let bytes = 0;
  const walk = (dir: string) => {
    if (files.length > MAX_FILES) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      throw Error("That folder contains files that cannot be read safely.");
    }
    for (const entry of entries) {
      if (entry.name === ".git") continue;
      const full = join(dir, entry.name);
      let st;
      try {
        st = lstatSync(full);
      } catch {
        throw Error("That folder contains files that cannot be read safely.");
      }
      if (st.isSymbolicLink())
        throw Error("That folder contains symbolic links and cannot be imported.");
      if (st.isDirectory()) walk(full);
      else if (st.isFile()) {
        const rel = relative(root, full).replaceAll("\\", "/");
        if (!rel || rel.startsWith("..")) throw Error("That folder path is not allowed.");
        if (st.nlink !== 1)
          throw Error("That folder contains linked files and cannot be imported.");
        if (st.size > MAX_FILE_BYTES)
          throw Error("That folder includes a file that is too large to import safely.");
        bytes += st.size;
        if (bytes > MAX_TOTAL_BYTES)
          throw Error("That folder is too large to inspect for a first commit.");
        files.push(rel);
        if (files.length > MAX_FILES)
          throw Error("That folder has too many files to import in one step.");
      } else throw Error("That folder contains special files and cannot be imported.");
    }
  };
  walk(root);
  return files.sort();
}

function scanWithTempGit(workTree: string, existingGitignore: boolean) {
  const gitDir = mkdtempSync(join(tmpdir(), "agentd-local-git-"));
  try {
    gitSeparate(gitDir, workTree, ["init", "-b", "main"]);
    if (existingGitignore) {
      // status already honors worktree .gitignore via separate git dir
    }
    const porcelain = gitSeparate(gitDir, workTree, [
      "status",
      "--porcelain=v1",
      "-z",
      "--untracked-files=all",
      "--ignored=matching",
    ]);
    const toAdd: string[] = [];
    const ignored: string[] = [];
    const parts = porcelain.split("\0").filter(Boolean);
    for (const part of parts) {
      // XY<space>path or !! path for ignored
      if (part.startsWith("!! ")) {
        ignored.push(part.slice(3).replaceAll("\\", "/"));
        continue;
      }
      if (part.length < 4) continue;
      const path = part.slice(3).replaceAll("\\", "/");
      if (path) toAdd.push(path);
    }
    return { toAdd: [...new Set(toAdd)].sort(), ignored: [...new Set(ignored)].sort() };
  } finally {
    rmSync(gitDir, { recursive: true, force: true });
  }
}

function scanSensitive(root: string, files: string[]) {
  const findings: Array<{ path: string; reasons: string[] }> = [];
  const refused: string[] = [];
  let bytes = 0;
  for (const rel of files) {
    const reasons: string[] = [];
    if (sensitiveFilename(rel)) reasons.push("sensitive filename");
    const full = join(root, rel);
    let st;
    try {
      st = lstatSync(full);
    } catch {
      refused.push(rel);
      continue;
    }
    if (!st.isFile() || st.isSymbolicLink()) {
      refused.push(rel);
      continue;
    }
    if (st.size > MAX_FILE_BYTES) {
      refused.push(rel);
      continue;
    }
    bytes += st.size;
    if (bytes > MAX_TOTAL_BYTES) {
      refused.push(rel);
      continue;
    }
    if (st.size > 0 && st.size <= 256 * 1024) {
      try {
        const text = readFileSync(full, "utf8");
        if (!text.includes("\0")) reasons.push(...sensitiveContent(text));
      } catch {
        // binary or unreadable — leave to refused only if unreadable
      }
    }
    if (reasons.length) findings.push({ path: rel, reasons: [...new Set(reasons)] });
  }
  return { findings, refused };
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

Project **${input.name}** was registered from a local folder on the AgentD host
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
  return { "AGENTS.md": agents, "docs/handover.md": handover };
}

function snapshotIdentity(
  canonical: string,
  files: string[],
  caseKind: LocalFolderCase,
  planned: string[] = [],
) {
  const hash = createHash("sha256");
  hash.update(caseKind);
  hash.update("\0");
  hash.update(canonical);
  hash.update("\0");
  for (const rel of files) {
    const full = join(canonical, rel);
    if (!existsSync(full)) {
      hash.update("missing:");
      hash.update(rel);
      hash.update("\0");
      continue;
    }
    const st = lstatSync(full);
    hash.update(rel);
    hash.update("\0");
    hash.update(String(st.size));
    hash.update("\0");
    hash.update(String(Math.trunc(st.mtimeMs)));
    hash.update("\0");
    hash.update(String(st.ino));
    hash.update("\0");
  }
  for (const rel of planned) {
    hash.update("planned:");
    hash.update(rel);
    hash.update("\0");
  }
  if (existsSync(join(canonical, ".git"))) {
    try {
      hash.update(localGit(canonical, ["rev-parse", "HEAD"]));
    } catch {
      hash.update("no-head");
    }
    try {
      hash.update(
        localGit(canonical, ["status", "--porcelain", "--untracked-files=all"]),
      );
    } catch {
      hash.update("status-unavailable");
    }
  }
  return hash.digest("hex");
}

export function inspectLocalFolder(input: {
  path: string;
  name: string;
  roots: string[];
  protectedPaths: string[];
}) {
  const { canonical, rootLabel, pathLabel } = resolveLocalFolderPath(
    input.path,
    input.roots,
    input.protectedPaths,
  );
  const nested = nestedGitRepos(canonical);
  if (nested.length)
    publicPathError("Nested Git repositories are not supported for local folder import.");
  const gitRoot = isGitRoot(canonical);
  let folderCase: LocalFolderCase;
  let filesToAdd: string[] = [];
  let ignoredOrExcluded: string[] = [];
  let dirty = false;
  let branch: string | null = null;
  let willCreateInitialCommit = false;
  let gitOperations: string[] = [];
  const refused: string[] = [];
  let sensitiveFindings: Array<{ path: string; reasons: string[] }> = [];

  if (gitRoot) {
    folderCase = "existing_git";
    if (!hasHead(canonical))
      publicPathError(
        "That Git repository has no commit yet. Finish setup before registering it.",
      );
    dirty = !!localGit(canonical, [
      "status",
      "--porcelain",
      "--untracked-files=all",
    ]).trim();
    try {
      branch = localGit(canonical, ["branch", "--show-current"]) || null;
    } catch {
      branch = null;
    }
    gitOperations = [
      "Register existing repository in place (no commit, no file changes)",
    ];
    willCreateInitialCommit = false;
    filesToAdd = [];
  } else {
    const allFiles = listDirectoryFiles(canonical);
    if (
      !allFiles.length &&
      readdirSync(canonical).filter((n) => n !== ".git").length === 0
    ) {
      folderCase = "empty";
      willCreateInitialCommit = true;
      gitOperations = [
        "git init -b main",
        "Create missing handover files",
        "Create approved empty initial commit",
      ];
      filesToAdd = [];
    } else {
      folderCase = "non_git";
      if (existsSync(join(canonical, ".git")))
        publicPathError(
          "That folder has an incomplete Git directory and cannot be imported.",
        );
      const listed = scanWithTempGit(
        canonical,
        existsSync(join(canonical, ".gitignore")),
      );
      filesToAdd = listed.toAdd;
      ignoredOrExcluded = listed.ignored;
      const scan = scanSensitive(canonical, filesToAdd);
      for (const finding of scan.findings) {
        filesToAdd = filesToAdd.filter((f) => f !== finding.path);
        ignoredOrExcluded.push(finding.path);
      }
      for (const rel of scan.refused) {
        refused.push(rel);
        filesToAdd = filesToAdd.filter((f) => f !== rel);
        ignoredOrExcluded.push(rel);
      }
      if (!filesToAdd.length && !allFiles.length)
        publicPathError("That folder has no importable files after safety checks.");
      if (scan.findings.length && !filesToAdd.length)
        publicPathError(
          "That folder includes sensitive filenames or credential-like content. Remove or ignore them before importing.",
        );
      willCreateInitialCommit = true;
      gitOperations = [
        "git init -b main",
        "Create missing handover files",
        "Stage allowed files (honoring .gitignore)",
        "Create approved initial commit",
      ];
      sensitiveFindings = scan.findings;
    }
  }

  const stackSource =
    folderCase === "existing_git"
      ? (() => {
          try {
            return listDirectoryFiles(canonical).slice(0, 200);
          } catch {
            return [] as string[];
          }
        })()
      : [...filesToAdd];
  const stack = detectStackHints(stackSource);
  const scaffold = handoverScaffold({
    name: input.name,
    pathLabel,
    rootLabel,
    stack,
    folderCase,
  });
  const handoverToCreate = Object.keys(scaffold).filter(
    (rel) => !existsSync(join(canonical, rel)),
  );
  if (folderCase !== "existing_git") {
    for (const rel of handoverToCreate)
      if (!filesToAdd.includes(rel)) filesToAdd.push(rel);
    filesToAdd = [...new Set(filesToAdd)].sort();
  }

  let snapshotFiles = filesToAdd;
  if (folderCase === "existing_git") {
    try {
      snapshotFiles = listDirectoryFiles(canonical).slice(0, 500);
    } catch {
      snapshotFiles = [];
    }
  }
  const snapshot = snapshotIdentity(
    canonical,
    snapshotFiles,
    folderCase,
    handoverToCreate,
  );
  return {
    canonical,
    rootLabel,
    pathLabel,
    case: folderCase,
    stack,
    dirty,
    branch,
    filesToAdd,
    ignoredOrExcluded: [...new Set(ignoredOrExcluded)].sort(),
    sensitiveFindings,
    handoverToCreate,
    gitOperations,
    willCreateInitialCommit,
    refused: [...new Set(refused)].sort(),
    snapshot,
    scaffold,
  };
}

export function localFolderPlans() {
  const plans = new Map<string, Plan>();
  function purge(now = Date.now()) {
    for (const [owner, plan] of plans) if (plan.expires < now) plans.delete(owner);
  }
  return {
    preview(
      owner: string,
      name: string,
      path: string,
      roots: string[],
      protectedPaths: string[],
    ) {
      purge();
      if (typeof owner !== "string" || !/^[a-f0-9]{64}$/.test(owner))
        throw Error("Browser owner required");
      const inspected = inspectLocalFolder({ path, name, roots, protectedPaths });
      const expires = Date.now() + PREVIEW_MS;
      const nonce = randomBytes(24).toString("hex");
      const fingerprint = createHash("sha256")
        .update(
          `agentd-local-folder:${owner}:${inspected.canonical}:${inspected.snapshot}:${name}:${expires}:${nonce}`,
        )
        .digest("hex");
      const preview: LocalFolderPreview = {
        fingerprint,
        expiresAt: new Date(expires).toISOString(),
        name,
        path: inspected.canonical,
        pathLabel: `${inspected.rootLabel}/${inspected.pathLabel}`.replace(/\/\.$/, ""),
        case: inspected.case,
        stack: inspected.stack,
        dirty: inspected.dirty,
        branch: inspected.branch,
        filesToAdd: inspected.filesToAdd,
        ignoredOrExcluded: inspected.ignoredOrExcluded,
        sensitiveFindings: inspected.sensitiveFindings ?? [],
        handoverToCreate: inspected.handoverToCreate,
        gitOperations: inspected.gitOperations,
        willCreateInitialCommit: inspected.willCreateInitialCommit,
        refused: inspected.refused,
      };
      plans.set(owner, {
        ...preview,
        owner,
        expires,
        snapshot: inspected.snapshot,
        canonical: inspected.canonical,
        rootLabel: inspected.rootLabel,
      });
      return preview;
    },
    take(owner: string, fingerprint: string) {
      purge();
      const plan = plans.get(owner);
      if (!plan || plan.expires < Date.now() || plan.fingerprint !== fingerprint)
        throw Error("Local folder preview expired. Review it again.");
      plans.delete(owner);
      return plan;
    },
    cancel(owner: string) {
      plans.delete(owner);
      return { ok: true };
    },
  };
}

export function applyLocalFolderImport(
  plan: Plan,
  roots: string[],
  protectedPaths: string[],
  register: (input: { id: string; name: string; repo: string }) => void,
) {
  const inspected = inspectLocalFolder({
    path: plan.canonical,
    name: plan.name,
    roots,
    protectedPaths,
  });
  if (
    inspected.canonical !== plan.canonical ||
    inspected.case !== plan.case ||
    inspected.snapshot !== plan.snapshot ||
    JSON.stringify(inspected.filesToAdd) !== JSON.stringify(plan.filesToAdd) ||
    JSON.stringify(inspected.handoverToCreate) !== JSON.stringify(plan.handoverToCreate)
  )
    throw Error("Local folder changed after preview. Review it again.");

  const createdFiles: string[] = [];
  let createdGit = false;
  const id = randomUUID();
  try {
    if (inspected.case === "existing_git") {
      register({ id, name: plan.name, repo: inspected.canonical });
      return { id, path: inspected.canonical, case: inspected.case };
    }

    if (!existsSync(join(inspected.canonical, ".git"))) {
      localGit(inspected.canonical, ["init", "-b", "main"]);
      createdGit = true;
    }
    const scaffold = handoverScaffold({
      name: plan.name,
      pathLabel: inspected.pathLabel,
      rootLabel: inspected.rootLabel,
      stack: inspected.stack,
      folderCase: inspected.case,
    });
    for (const rel of inspected.handoverToCreate) {
      const full = join(inspected.canonical, rel);
      if (existsSync(full)) continue;
      mkdirSync(dirname(full), { recursive: true, mode: 0o700 });
      writeFileSync(full, scaffold[rel as keyof typeof scaffold], { mode: 0o600 });
      createdFiles.push(rel);
    }
    if (inspected.willCreateInitialCommit) {
      if (inspected.case === "empty") {
        localGit(inspected.canonical, ["add", "-A"]);
      } else {
        for (const rel of inspected.filesToAdd) {
          if (rel.includes("\0") || rel.startsWith("/") || rel.includes(".."))
            throw Error("Import file list is invalid.");
          localGit(inspected.canonical, ["add", "--", rel]);
        }
      }
      localGit(inspected.canonical, [
        "-c",
        "user.name=agentd",
        "-c",
        "user.email=agentd@localhost",
        "commit",
        ...(inspected.case === "empty" ? ["--allow-empty"] : []),
        "-m",
        "Initialize local AgentD project",
      ]);
    }
    register({ id, name: plan.name, repo: inspected.canonical });
    return { id, path: inspected.canonical, case: inspected.case };
  } catch (error) {
    for (const rel of createdFiles) {
      try {
        unlinkSync(join(inspected.canonical, rel));
      } catch {
        /* best effort */
      }
    }
    if (createdGit) {
      try {
        rmSync(join(inspected.canonical, ".git"), { recursive: true, force: true });
      } catch {
        /* best effort */
      }
    }
    throw error;
  }
}
