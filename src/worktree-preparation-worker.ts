import { readFileSync } from "node:fs";
import { dirname, isAbsolute } from "node:path";
import { localGit } from "./git-policy.ts";
import { checkoutBudget, requireSpace } from "./resources.ts";
import { restoreSnapshot } from "./changes.ts";
import { publicError } from "./public-errors.ts";
import { type Checkout } from "./worktree-preparation.ts";

// Input is supplied only over the parent's private pipe. No repository scripts,
// inherited credentials, hooks, filters or transport configuration are accepted.
try {
  const input: Checkout = JSON.parse(readFileSync(0, "utf8"));
  if (
    !isAbsolute(input.repo) ||
    !isAbsolute(input.tree) ||
    !/^[a-f0-9]{40}$/.test(input.revision) ||
    (input.seed !== null && !/^[a-f0-9]{40}$/.test(input.seed))
  )
    throw Error("Invalid worktree preparation input.");
  const baseBytes = checkoutBudget(input.repo, input.revision, input.limits);
  const bytes =
    baseBytes + (input.seed ? checkoutBudget(input.repo, input.seed, input.limits) : 0);
  requireSpace([dirname(input.tree)], input.limits.reserveBytes + bytes);
  localGit(input.repo, ["worktree", "add", "--detach", input.tree, input.revision]);
  if (input.seed) restoreSnapshot(input.tree, input.seed);
  process.stdout.write(JSON.stringify({ ok: true }));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, error: publicError(e) }));
  process.exitCode = 1;
}
