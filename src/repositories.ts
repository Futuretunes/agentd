import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, readdirSync, lstatSync } from "node:fs";
import { join } from "node:path";
import { lookup } from "node:dns/promises";
import { publicAddress } from "./egress-proxy.ts";
export function githubURL(value: unknown) {
  if (typeof value !== "string" || value.length > 250)
    throw Error("Enter a GitHub repository URL.");
  const match =
    /^https:\/\/github\.com\/([A-Za-z0-9][A-Za-z0-9-]{0,38})\/([A-Za-z0-9_.-]{1,100})\/?$/.exec(
      value.trim(),
    );
  if (!match || [".", ".."].includes(match[2]))
    throw Error(
      "Use https://github.com/owner/repository without credentials or extra paths.",
    );
  const name = match[2].replace(/\.git$/, "");
  if (!name || [".", ".."].includes(name)) throw Error("Invalid repository name.");
  return `https://github.com/${match[1].toLowerCase()}/${name.toLowerCase()}.git`;
}
export function branchName(value: unknown) {
  if (
    typeof value !== "string" ||
    !value ||
    value.length > 200 ||
    !/^[-A-Za-z0-9_./]+$/.test(value) ||
    value.startsWith("-") ||
    value.startsWith("/") ||
    value.endsWith("/") ||
    value.endsWith(".") ||
    value.includes("..") ||
    value.includes("//") ||
    value.split("/").some((p) => p.startsWith(".") || p.endsWith(".lock")) ||
    value === "HEAD"
  )
    throw Error("Choose a valid branch name.");
  return value;
}
export { gitPolicy } from "./git-policy.ts";
import {
  gitPolicy,
  gitEnvironment,
  assertGitConfig,
  GitOutputLimitError,
} from "./git-policy.ts";
export function checkRepositorySize(path: string) {
  let total = 0,
    count = 0;
  const scan = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (++count > 100000) throw Error("Repository exceeds the file limit.");
      const p = join(dir, name),
        s = lstatSync(p);
      if (s.isSymbolicLink()) continue;
      if (s.isDirectory()) scan(p);
      else total += s.size;
      if (total > 512 * 1024 * 1024) throw Error("Repository exceeds the 512 MB limit.");
    }
  };
  scan(path);
}
export function repositoryGit(options: {
  stateDir: string;
  githubProfile?: string;
  gh?: string;
  resolve?: () => Promise<string>;
}) {
  const resolve =
    options.resolve ??
    (async () => {
      const addresses = await lookup("github.com", { all: true });
      if (!addresses.length || addresses.some((a) => !publicAddress(a.address)))
        throw Error("GitHub resolved to a disallowed address.");
      const selected = addresses.find((a) => a.family === 4) ?? addresses[0];
      return selected.family === 6 ? "[" + selected.address + "]" : selected.address;
    });
  return async function git(
    cwd: string,
    args: string[],
    signal: AbortSignal,
    network = false,
    budget?: string,
    acceptOne = false,
    preserveOneOutput = false,
    maxOutput = 256000,
  ) {
    const home = mkdtempSync(join(options.stateDir, "git-home-"));
    mkdirSync(join(home, "templates"));
    try {
      const ip = network ? await resolve() : null;
      if (signal.aborted) throw Error("Repository operation cancelled.");
      assertGitConfig(cwd);
      const config = [
        ...gitPolicy,
        ...(network ? ["-c", "protocol.https.allow=always"] : []),
        "-c",
        "init.templateDir=" + join(home, "templates"),
      ];
      if (ip) config.push("-c", "http.curloptResolve=github.com:443:" + ip);
      if (network && options.githubProfile)
        config.push(
          "-c",
          "credential.helper=" +
            (options.gh ?? "/usr/local/bin/gh") +
            " auth git-credential",
        );
      return await new Promise<string>((resolve, reject) => {
        const env = {
          ...gitEnvironment(home),
          GH_CONFIG_DIR: options.githubProfile ?? join(home, "gh"),
          GH_PROMPT_DISABLED: "1",
          GH_HOST: "github.com",
        };
        const child = spawn("/usr/bin/git", [...config, ...args], {
          cwd,
          env,
          detached: true,
          stdio: ["ignore", "pipe", "ignore"],
        });
        let output = "",
          outputBytes = 0,
          stopped = false;
        const kill = () => {
          stopped = true;
          if (child.pid)
            try {
              process.kill(-child.pid, "SIGKILL");
            } catch {}
        };
        const timer = setTimeout(kill, 120000);
        signal.addEventListener("abort", kill, { once: true });
        if (signal.aborted) kill();
        const monitor = budget
          ? setInterval(() => {
              try {
                checkRepositorySize(budget);
              } catch (e) {
                if ((e as NodeJS.ErrnoException).code !== "ENOENT") kill();
              }
            }, 1000)
          : undefined;
        child.stdout.on("data", (v) => {
          output += v.toString();
          outputBytes += v.length;
          if (outputBytes > maxOutput) kill();
        });
        child.on("error", () => {});
        child.on("close", (code) => {
          clearTimeout(timer);
          if (monitor) clearInterval(monitor);
          signal.removeEventListener("abort", kill);
          if (child.pid)
            try {
              process.kill(-child.pid, "SIGKILL");
            } catch {}
          try {
            if (budget) checkRepositorySize(budget);
          } catch {
            stopped = true;
          }
          if (!stopped && (code === 0 || (acceptOne && code === 1)))
            resolve(code === 1 && !preserveOneOutput ? "NOT_ANCESTOR" : output.trim());
          else
            reject(
              outputBytes > maxOutput
                ? new GitOutputLimitError()
                : Error(
                    stopped
                      ? "Repository operation stopped or exceeded its time/size limit."
                      : "Git could not complete this operation. Check the repository, branch and GitHub connection.",
                  ),
            );
        });
      });
    } finally {
      rmSync(home, { recursive: true, force: true });
    }
  };
}
export type RepositoryGit = ReturnType<typeof repositoryGit>;
export async function inspectRepository(
  git: RepositoryGit,
  cwd: string,
  url: string,
  signal: AbortSignal,
) {
  const output = await git(
    cwd,
    ["ls-remote", "--symref", url, "HEAD", "refs/heads/*"],
    signal,
    true,
  );
  const branches: string[] = [];
  let defaultBranch = "";
  for (const line of output.split("\n")) {
    const head = /^ref: refs\/heads\/(.+)\tHEAD$/.exec(line);
    if (head)
      try {
        defaultBranch = branchName(head[1]);
      } catch {}
    const ref = /^[a-f0-9]{40,64}\trefs\/heads\/(.+)$/.exec(line);
    if (ref)
      try {
        branches.push(branchName(ref[1]));
      } catch {}
  }
  if (!branches.length)
    throw Error(
      "No supported branches found. The repository may be empty or require GitHub sign-in.",
    );
  return {
    branches: branches.sort(),
    defaultBranch: branches.includes(defaultBranch) ? defaultBranch : branches[0],
  };
}
export async function updateRepository(
  git: RepositoryGit,
  repo: string,
  url: string,
  branch: string,
  signal: AbortSignal,
) {
  const clean = async () => {
    if (await git(repo, ["status", "--porcelain", "--untracked-files=all"], signal))
      throw Error("Local changes exist. Commit or move them before updating.");
    if ((await git(repo, ["symbolic-ref", "--short", "HEAD"], signal)) !== branch)
      throw Error(
        "The project is on a different branch. Restore its imported branch before updating.",
      );
    if ((await git(repo, ["config", "--get", "remote.origin.url"], signal)) !== url)
      throw Error("The remote changed. Review it before updating.");
  };
  await clean();
  const before = await git(repo, ["rev-parse", "HEAD"], signal);
  await git(
    repo,
    ["fetch", "--no-tags", "--no-recurse-submodules", url, "refs/heads/" + branch],
    signal,
    true,
    repo,
  );
  await clean();
  if ((await git(repo, ["rev-parse", "HEAD"], signal)) !== before)
    throw Error("The local revision changed during the update. Try again.");
  const target = await git(repo, ["rev-parse", "FETCH_HEAD^{commit}"], signal);
  if (before === target) return { changed: false, revision: target };
  if (
    (await git(
      repo,
      ["merge-base", "--is-ancestor", before, target],
      signal,
      false,
      undefined,
      true,
    )) === "NOT_ANCESTOR"
  )
    throw Error(
      "Branches diverged or local commits are ahead. No files were overwritten.",
    );
  if (signal.aborted) throw Error("Update cancelled before applying files.");
  // Do not interrupt Git while it is replacing the index and working files.
  await git(
    repo,
    ["merge", "--ff-only", "--no-edit", "--no-stat", target],
    new AbortController().signal,
  );
  return { changed: true, revision: target };
}
