# 2026-09-28 — Responsive worktree preparation

- Author: Codex; R10 task checkout portion.
- Branch: `feat/async-worktree-preparation` from the standalone formatter stack.
- Cumulative release 0.33.0, task schema 2. Uninstalled; production remains 0.22.0/schema 1.

## Changes

Task checkout and snapshot restoration run in a trusted child process instead of blocking the runner event loop. The existing active-worker slot spans preparation and model execution, so account/dependency and other existing exclusions remain in force. Cancellation and shutdown stop the preparation process group, wait for exit and never start a model afterward. Preparation has a 60-second bound and 4 KiB response bound; errors are normalized through the public error policy. This helper runs only fixed local Git operations with the shared environment/configuration safeguards, not repository scripts or agent commands.

The intended worktree path is persisted before preparation. Partial worktrees are preserved on failure/cancellation; editable ones are marked for review. Both the base checkout and optional seed snapshot receive budget checks, with conservative combined free-space admission. Incomplete Git state is not automatically deleted or repaired. Per-command Git timeouts and the aggregate service resource profile still apply.

The reviewed fixed-error extractor accepts formatter-inserted trailing commas; catalog additions are fixed strings only. Existing tests that injected partial edits now wait for actual checkout readiness, since running includes preparation.

## Validation

16 focused runner/preparation tests passed, including event-loop progress, real shared Git-policy rejection and size admission, cancellation with partial files retained, no model dispatch on cancellation, and shutdown. Typecheck passed. The first exact Linux run passed 138/139; a pre-existing settings test assumed running meant checkout had completed. It now waits for the fixture file, preserving its original partial-edit and policy assertions. Corrected exact archive `ba2c5a53b67be174f875cd890ba81104db127799` passed 139/139 Linux tests with zero skips, typecheck and formatting check. SHA-256: `4e90e57f8289408f0280bb7ddb1c7504681ecb58bb9137b6520ebce67e6ba464`. CI run 36484873135 passed. Draft PR #37 is open. No live model, account, deployment or deletion operations.

## Remaining and deployment

R10 remains partial: request-time project creation, reviews/check snapshots, integration and other synchronous Git calls still need extraction and operation-compatibility review. Preparation is not a new global lock design. A crash can leave partial registered worktrees/Git lock files for manual review; it never blindly removes them. Use the cumulative managed installer plus explicit resource migration, with matching schema-2 application/data rollback. Keep production state and exact candidate validation separate. Next: stage one cumulative release, then assess the remaining operation compatibility work.
