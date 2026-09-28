import { execFileSync } from "node:child_process";

// Authority comes from the caller, never the daemon's inherited environment.
export const gitPolicy = Object.freeze([
  "-c",
  "core.hooksPath=/dev/null",
  "-c",
  "protocol.allow=never",
  "-c",
  "protocol.https.allow=never",
  "-c",
  "http.followRedirects=false",
  "-c",
  "http.sslVerify=true",
  "-c",
  "http.proxy=",
  "-c",
  "credential.helper=",
  "-c",
  "core.protectNTFS=true",
  "-c",
  "core.protectHFS=true",
  "-c",
  "fetch.fsckObjects=true",
  "-c",
  "transfer.fsckObjects=true",
  "-c",
  "submodule.recurse=false",
  "-c",
  "gc.auto=0",
  "-c",
  "maintenance.auto=false",
  "-c",
  "core.fsmonitor=false",
  "-c",
  "init.templateDir=",
  "-c",
  "merge.verifySignatures=false",
  "-c",
  "core.attributesFile=/dev/null",
  "-c",
  "commit.gpgSign=false",
  "-c",
  "tag.gpgSign=false",
  "-c",
  "core.pager=cat",
]);
export function gitEnvironment(
  home = "/nonexistent",
  index?: string,
): NodeJS.ProcessEnv {
  return {
    PATH: "/usr/local/bin:/usr/bin:/bin",
    HOME: home,
    XDG_CONFIG_HOME: home,
    LANG: "C.UTF-8",
    GIT_CONFIG_GLOBAL: "/dev/null",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_ATTR_NOSYSTEM: "1",
    GIT_TERMINAL_PROMPT: "0",
    GIT_LFS_SKIP_SMUDGE: "1",
    ...(index ? { GIT_INDEX_FILE: index } : {}),
  };
}
export class GitOutputLimitError extends Error {
  constructor() {
    super(
      "Git output exceeds the safe review limit. Reduce the changes or review them separately.",
    );
    this.name = "GitOutputLimitError";
  }
}
function raw(
  repo: string,
  args: string[],
  options: { index?: string; maxBuffer?: number } = {},
) {
  try {
    return execFileSync("/usr/bin/git", [...gitPolicy, "-C", repo, ...args], {
      encoding: "utf8",
      env: gitEnvironment(undefined, options.index),
      timeout: 15000,
      maxBuffer: options.maxBuffer ?? 4 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOBUFS")
      throw new GitOutputLimitError();
    throw error;
  }
}
// Do not follow includes, then refuse them as well as repository-defined executable
// drivers and transport overrides. Overrides above suppress ordinary hooks and fsmonitor.
export function assertGitConfig(repo: string) {
  const dangerous =
    "^(include\\.path|includeif\\..*\\.path|filter\\..*\\.(clean|smudge|process)|merge\\..*\\.driver|diff\\.external|diff\\..*\\.(command|textconv)|url\\..*\\.(insteadof|pushinsteadof)|remote\\..*\\.(proxy|uploadpack|receivepack)|http\\..*|credential\\..*|core\\.(sshcommand|gitproxy))$";
  // --local avoids matching the policy's own safe http/credential overrides.
  const scopes = ["--local"];
  try {
    if (
      raw(repo, [
        "config",
        "--local",
        "--no-includes",
        "--bool",
        "--get",
        "extensions.worktreeConfig",
      ]).trim() === "true"
    )
      scopes.push("--worktree");
  } catch (error) {
    if ((error as any).status !== 1) {
      if (
        (error as any).status === 128 &&
        String((error as any).stderr).includes(
          "--local can only be used inside a git repository",
        )
      )
        return;
      throw Error("Could not verify repository Git configuration mode.");
    }
  }
  for (const scope of scopes) {
    try {
      raw(repo, [
        "config",
        scope,
        "--no-includes",
        "--name-only",
        "--get-regexp",
        dangerous,
      ]);
    } catch (error) {
      if ((error as any).status === 1) continue;
      // A clone/init destination is deliberately not a repository yet.
      if (
        (error as any).status === 128 &&
        String((error as any).stderr).includes(
          "--local can only be used inside a git repository",
        )
      )
        return;
      throw Error("Could not verify repository Git configuration.");
    }
    throw Error(
      "Custom merge or checkout drivers, includes or transport overrides are unsupported. Review repository Git configuration.",
    );
  }
}
export function gitOutput(
  repo: string,
  args: string[],
  options: { index?: string; maxBuffer?: number } = {},
) {
  assertGitConfig(repo);
  return raw(repo, args, options);
}
export function localGit(
  repo: string,
  args: string[],
  extra: NodeJS.ProcessEnv = {},
) {
  if (Object.keys(extra).some((key) => key !== "GIT_INDEX_FILE"))
    throw Error("Unsupported Git environment override");
  return gitOutput(repo, args, { index: extra.GIT_INDEX_FILE }).trim();
}
