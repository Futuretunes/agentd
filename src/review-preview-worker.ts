import { readFileSync } from "node:fs";
import { snapshot } from "./changes.ts";
import { unresolvedConflicts } from "./github-review.ts";
import { publicError } from "./public-errors.ts";
try {
  const input = JSON.parse(readFileSync(0, "utf8"));
  const value = snapshot(input.worktree, input.revision, input.stateDir);
  const conflicts = input.mergeParent
    ? unresolvedConflicts(input.worktree, value.tree, [
        ...new Set([...input.conflictPaths, ...value.files]),
      ] as string[])
    : [];
  process.stdout.write(JSON.stringify({ ok: true, value: { ...value, conflicts } }));
} catch (error) {
  process.stdout.write(JSON.stringify({ ok: false, error: publicError(error) }));
  process.exitCode = 1;
}
