import {
  sensitiveFilename,
  sensitiveContent,
  binaryNumstat,
  scanLimits,
  contentScan,
  acceptBlob,
  blobID,
} from "./sensitive-data.ts";
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { githubURL, branchName, type RepositoryGit } from "./repositories.ts";
export type PullAPI = (
  destination: string,
  branch: string,
  base: string,
  data: { title: string; body: string } | null,
  signal: AbortSignal,
) => Promise<any>;
export async function githubRequest(
  state: string,
  profile: string,
  endpoint: string,
  data: unknown,
  signal: AbortSignal,
  executable = "/usr/local/bin/gh",
): Promise<any> {
  const home = mkdtempSync(join(state, "git-home-"));
  try {
    return await new Promise((resolve, reject) => {
      const args = [
        "api",
        "--hostname",
        "github.com",
        "-H",
        "Accept: application/vnd.github+json",
        "-H",
        "X-GitHub-Api-Version: 2026-03-10",
        "--method",
        data ? "POST" : "GET",
        endpoint,
        ...(data ? ["--input", "-"] : []),
      ];
      const child = spawn(executable, args, {
        cwd: home,
        env: {
          HOME: home,
          GH_CONFIG_DIR: profile,
          GH_HOST: "github.com",
          GH_PROMPT_DISABLED: "1",
          PATH: "/usr/local/bin:/usr/bin:/bin",
        },
        detached: true,
        stdio: ["pipe", "pipe", "ignore"],
      });
      let output = "",
        stopped = false;
      const stop = () => {
        stopped = true;
        if (child.pid)
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {}
      };
      signal.addEventListener("abort", stop, { once: true });
      const timer = setTimeout(stop, 60000);
      if (signal.aborted) stop();
      child.on("error", () => {});
      child.stdin.on("error", () => {});
      child.stdout.on("data", (v) => {
        output += v.toString();
        if (output.length > 2_000_000) stop();
      });
      child.stdin.end(data ? JSON.stringify(data) : undefined);
      child.on("close", (code) => {
        clearTimeout(timer);
        signal.removeEventListener("abort", stop);
        if (child.pid)
          try {
            process.kill(-child.pid, "SIGKILL");
          } catch {}
        try {
          if (code !== 0 || stopped) throw Error();
          resolve(JSON.parse(output));
        } catch {
          reject(
            Error(
              "GitHub could not confirm the pull-request operation. Check your GitHub connection and repository permissions, then preview again to reconcile any completed work.",
            ),
          );
        }
      });
    });
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
}
export function githubPullAPI(
  state: string,
  profile: string,
  executable = "/usr/local/bin/gh",
): PullAPI {
  return async (destination, branch, base, data, signal) => {
    const slug = githubURL(destination).slice("https://github.com/".length, -4),
      owner = slug.split("/")[0],
      endpoint =
        "repos/" +
        slug +
        "/pulls" +
        (data
          ? ""
          : "?state=all&head=" +
            encodeURIComponent(owner + ":" + branch) +
            "&base=" +
            encodeURIComponent(base) +
            "&per_page=100");
    return githubRequest(
      state,
      profile,
      endpoint,
      data ? { ...data, head: branch, base, draft: true } : null,
      signal,
      executable,
    );
  };
}
export type PublishPlan = {
  destination: string;
  base: string;
  baseSha: string;
  head: string;
  branch: string;
  localBranch?: string;
  previousHead?: string;
  pullNumber?: number;
  title: string;
  body: string;
  draft: true;
  commits: { sha: string; subject: string; patch: string }[];
  stat: string;
  fingerprint: string;
};
export function publicationText(title: unknown, body: unknown) {
  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.length > 200 ||
    typeof body !== "string" ||
    body.length > 12000
  )
    throw Error(
      "Enter a PR title (up to 200 characters) and description (up to 12,000).",
    );
  if (sensitiveContent(title + "\n" + body).length)
    throw Error(
      "Pull request text may contain credential content. Remove it before publishing.",
    );
  return { title: title.trim(), body };
}
async function remoteRef(
  git: RepositoryGit,
  repo: string,
  url: string,
  branch: string,
  signal: AbortSignal,
) {
  const out = await git(
    repo,
    ["ls-remote", "--heads", url, "refs/heads/" + branch],
    signal,
    true,
  );
  if (!out) return null;
  const lines = out.split("\n");
  if (lines.length !== 1 || !new RegExp("^[a-f0-9]{40}\\t").test(out))
    throw Error("Could not verify remote branch.");
  return out.split("\t")[0];
}
export async function previewPublication(options: {
  git: RepositoryGit;
  repo: string;
  task: string;
  head: string;
  base: string;
  title: string;
  body: string;
  approved: (sha: string, tree: string) => boolean;
  approvedMerge?: (sha: string, parents: string[]) => boolean;
  signal: AbortSignal;
  api?: PullAPI;
  update?: {
    destination: string;
    branch: string;
    head: string;
    base: string;
    number: number;
  };
}) {
  const { git, repo, signal, head } = options;
  if (!/^[a-f0-9]{40}$/.test(head) || !/^[a-f0-9-]{36}$/.test(options.task))
    throw Error("Invalid approved commit.");
  const localBranch = "agentd/" + options.task,
    base = branchName(options.update?.base ?? options.base),
    branch = options.update?.branch ?? localBranch;
  const destination = githubURL(
    await git(repo, ["config", "--get", "remote.origin.url"], signal),
  );
  if (
    options.update &&
    (options.update.destination !== destination ||
      !/^agentd\/[a-f0-9-]{36}$/.test(branch) ||
      !Number.isSafeInteger(options.update.number))
  )
    throw Error("Invalid previous publication");
  if (base === branch) throw Error("Choose a different base branch.");
  if ((await git(repo, ["rev-parse", "refs/heads/" + localBranch], signal)) !== head)
    throw Error("The approved local branch changed. Review it before publishing.");
  await git(
    repo,
    ["fetch", "--no-tags", "--no-recurse-submodules", destination, "refs/heads/" + base],
    signal,
    true,
    repo,
  );
  const baseSha = await git(repo, ["rev-parse", "FETCH_HEAD^{commit}"], signal);
  if (
    (await git(
      repo,
      ["merge-base", "--is-ancestor", baseSha, head],
      signal,
      false,
      undefined,
      true,
    )) === "NOT_ANCESTOR"
  )
    throw Error(
      "The GitHub base advanced or diverged. Update and review the changes against the current base before publishing.",
    );
  const revisions = (
    await git(repo, ["rev-list", "--reverse", baseSha + ".." + head], signal)
  )
    .split("\n")
    .filter(Boolean);
  if (!revisions.length || revisions.length > 20)
    throw Error("Publish between 1 and 20 reviewed commits at a time.");
  const commits = [];
  let size = 0;
  const scan = contentScan();
  for (const sha of revisions) {
    const tree = await git(repo, ["rev-parse", sha + "^{tree}"], signal);
    if (!options.approved(sha, tree))
      throw Error(
        "Every outgoing commit must have passing checks and explicit local commit approval in this project.",
      );
    const parents = (
      await git(repo, ["rev-list", "--parents", "-n", "1", sha], signal)
    ).split(" ");
    if (
      parents.length !== 2 &&
      !(parents.length === 3 && options.approvedMerge?.(sha, parents.slice(1)))
    )
      throw Error("Only explicitly reviewed integration merges are supported.");
    const names = (
      await git(
        repo,
        ["diff", "--name-only", "-z", "--no-renames", sha + "^", sha],
        signal,
      )
    )
      .split("\0")
      .filter(Boolean);
    if (names.some(sensitiveFilename))
      throw Error(
        "Outgoing history includes a sensitive filename. Resolve it before publishing.",
      );
    if (names.length > scanLimits.files)
      throw Error(
        "Outgoing history has too many changed files for sensitive-data review.",
      );
    for (const name of names)
      for (const rev of [sha + "^", sha]) {
        const blob = blobID(
          await git(
            repo,
            ["--literal-pathspecs", "ls-tree", "-z", rev, "--", name],
            signal,
          ),
        );
        if (
          !blob ||
          !acceptBlob(scan, blob, await git(repo, ["cat-file", "-s", blob], signal))
        )
          continue;
        const body = await git(repo, ["cat-file", "blob", blob], signal);
        if (body.includes("\0") || sensitiveContent(body).length)
          throw Error(
            "Outgoing history includes binary or possible credential content. Resolve it before publishing.",
          );
      }
    if (
      binaryNumstat(
        await git(
          repo,
          ["diff", "--numstat", "-z", "--no-renames", sha + "^", sha],
          signal,
        ),
      )
    )
      throw Error(
        "Outgoing history contains binary changes. This GUI cannot approve it.",
      );
    const patch = await git(
      repo,
      [
        "diff",
        "--no-ext-diff",
        "--no-textconv",
        "--no-color",
        "--no-renames",
        sha + "^",
        sha,
      ],
      signal,
    );
    size += Buffer.byteLength(patch);
    if (size > 180000)
      throw Error("Outgoing history is too large. This GUI cannot approve it.");
    const subject = await git(repo, ["show", "-s", "--format=%s", sha], signal);
    if (
      sensitiveContent(await git(repo, ["show", "-s", "--format=%B", sha], signal)).length
    )
      throw Error(
        "Outgoing commit message may contain credential content. Review it separately.",
      );
    commits.push({ sha, subject, patch });
  }
  const existing = await remoteRef(git, repo, destination, branch, signal);
  if (existing && existing !== head && existing !== options.update?.head)
    throw Error(
      "The remote publishing branch contains different work. It will not be overwritten.",
    );
  let metadata = publicationText(options.title, options.body);
  let updateFields = {};
  if (options.update) {
    if (!existing)
      throw Error("The previously published branch is missing. Inspect GitHub.");
    if (
      (await git(
        repo,
        ["merge-base", "--is-ancestor", options.update.head, head],
        signal,
        false,
        undefined,
        true,
      )) === "NOT_ANCESTOR"
    )
      throw Error("PR updates must extend the previously approved commit.");
    const pulls = await options.api!(destination, branch, base, null, signal),
      pull = Array.isArray(pulls) && pulls.length === 1 ? pulls[0] : null;
    verifiedPull(pull, { destination, head: existing, branch, base } as PublishPlan);
    if (
      pull.number !== options.update.number ||
      pull.state !== "open" ||
      pull.draft !== true
    )
      throw Error("Only the existing open draft PR can be updated.");
    metadata = publicationText(pull.title, pull.body ?? "");
    updateFields = { previousHead: options.update.head, pullNumber: pull.number };
  }
  const stat = await git(repo, ["diff", "--stat", "--no-renames", baseSha, head], signal),
    fields = {
      destination,
      base,
      baseSha,
      head,
      branch,
      localBranch,
      ...updateFields,
      ...metadata,
      draft: true as const,
      commits,
      stat,
    };
  return {
    ...fields,
    fingerprint: createHash("sha256").update(JSON.stringify(fields)).digest("hex"),
  };
}
export function verifiedPull(p: any, plan: PublishPlan) {
  const slug = plan.destination.slice("https://github.com/".length, -4);
  if (
    !Number.isSafeInteger(p?.number) ||
    p.number < 1 ||
    p.head?.sha !== plan.head ||
    p.head?.ref !== plan.branch ||
    p.base?.ref !== plan.base ||
    p.head?.repo?.full_name?.toLowerCase() !== slug ||
    p.base?.repo?.full_name?.toLowerCase() !== slug
  )
    throw Error(
      "GitHub returned a different pull request. Inspect the repository before retrying.",
    );
  return "https://github.com/" + slug + "/pull/" + p.number;
}
export async function executePublication(
  git: RepositoryGit,
  api: PullAPI,
  repo: string,
  plan: PublishPlan,
  signal: AbortSignal,
  checkpoint: (stage: string) => void,
) {
  if (
    githubURL(await git(repo, ["config", "--get", "remote.origin.url"], signal)) !==
      plan.destination ||
    (await git(
      repo,
      ["rev-parse", "refs/heads/" + (plan.localBranch ?? plan.branch)],
      signal,
    )) !== plan.head
  )
    throw Error("Publishing destination or local branch changed. Preview again.");
  if ((await remoteRef(git, repo, plan.destination, plan.base, signal)) !== plan.baseSha)
    throw Error("The GitHub base changed. Preview again before publishing.");
  const head = await remoteRef(git, repo, plan.destination, plan.branch, signal);
  if (head && head !== plan.head && head !== plan.previousHead)
    throw Error("Remote branch changed; it will not be overwritten.");
  const existing = await api(plan.destination, plan.branch, plan.base, null, signal);
  if (!Array.isArray(existing) || existing.length > 1)
    throw Error("Ambiguous existing pull requests. Inspect GitHub before continuing.");
  if (plan.previousHead) {
    const pull = existing[0];
    if (
      !head ||
      existing.length !== 1 ||
      pull.number !== plan.pullNumber ||
      pull.state !== "open" ||
      pull.draft !== true
    )
      throw Error("The draft PR or its branch changed. Inspect GitHub before updating.");
    const url = verifiedPull(pull, { ...plan, head });
    if (head === plan.head) return { url, reused: true };
    if (
      (await git(
        repo,
        ["merge-base", "--is-ancestor", plan.previousHead, plan.head],
        signal,
        false,
        undefined,
        true,
      )) === "NOT_ANCESTOR"
    )
      throw Error("Only forward PR updates are allowed.");
    checkpoint("pushing");
    await git(
      repo,
      [
        "push",
        "--porcelain",
        "--no-follow-tags",
        "--recurse-submodules=no",
        "--force-with-lease=refs/heads/" + plan.branch + ":" + plan.previousHead,
        plan.destination,
        plan.head + ":refs/heads/" + plan.branch,
      ],
      signal,
      true,
    );
    checkpoint("branch_published");
    const updated = await api(plan.destination, plan.branch, plan.base, null, signal);
    if (
      !Array.isArray(updated) ||
      updated.length !== 1 ||
      updated[0].number !== plan.pullNumber ||
      updated[0].state !== "open" ||
      updated[0].draft !== true ||
      updated[0].base?.sha !== plan.baseSha
    )
      throw Error(
        "Branch uploaded but PR state changed. Inspect GitHub before continuing.",
      );
    return { url: verifiedPull(updated[0], plan), reused: true };
  }
  if (existing.length) return { url: verifiedPull(existing[0], plan), reused: true };
  if (!head) {
    checkpoint("pushing");
    await git(
      repo,
      [
        "push",
        "--porcelain",
        "--no-follow-tags",
        "--recurse-submodules=no",
        "--force-with-lease=refs/heads/" + plan.branch + ":",
        plan.destination,
        plan.head + ":refs/heads/" + plan.branch,
      ],
      signal,
      true,
    );
  }
  checkpoint("branch_published");
  if ((await remoteRef(git, repo, plan.destination, plan.branch, signal)) !== plan.head)
    throw Error("Could not confirm the published branch. Preview again to reconcile.");
  if ((await remoteRef(git, repo, plan.destination, plan.base, signal)) !== plan.baseSha)
    throw Error(
      "Base changed after the branch was published. Preview again before creating a PR.",
    );
  checkpoint("creating_pr");
  const result = await api(
    plan.destination,
    plan.branch,
    plan.base,
    { title: plan.title, body: plan.body },
    signal,
  );
  if (result?.draft !== true || result?.base?.sha !== plan.baseSha)
    throw Error(
      "GitHub created a PR with a changed base or draft state. Inspect GitHub before continuing.",
    );
  return { url: verifiedPull(result, plan), reused: false };
}
