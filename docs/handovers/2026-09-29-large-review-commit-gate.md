+# 2026-09-29 — Exact-coverage large-review commit gate

- Author/agent: Codex
- Requested outcome: continue the next backlog item after bounded paginated review.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.59.0, task schema 2.
- Branch and base: `feat/large-review-commit-eligibility` from `feat/paginated-large-review`.
- Implementation commit: `39c30b498a52a4188102e9506285b4b8c98a1851`.
- PR: pending against PR #63's branch.

## Changes and relevant files

A truncated aggregate review can now advance to checks and commit only when every changed file has durable coverage for the same task and exact Git tree. `src/review-acknowledgements.ts` combines exact-file acknowledgements with complete paginated-file evidence and refuses an empty or partial set. Because the tree object is content-addressed and acknowledgements are accepted only after the server recomputes their fingerprints, changed content cannot reuse prior coverage.

`src/runner.ts` enforces the coverage predicate before checks and again before commit. Commit still requires passing checks for the exact tree, no conflicts, and no blocked sensitive, binary or unscannable files. Changed worktree content produces a different tree and must be reviewed again. `public/app.js` keeps checks disabled until coverage is complete, refreshes after the final acknowledgement, and then exposes the existing exact-tree check and commit flow.

This slice does not authorize revision requests or restart-with-settings for oversized changes. Those paths remain blocked. Loading or navigating review content still records no evidence, and globally oversized files remain unavailable.

## Validation evidence

- Typecheck and formatting passed.
- Focused durable-evidence, incomplete-coverage, exact-check and commit integration tests passed.
- macOS full suite: 191 passed, 0 failed; nine Linux-only tests skipped as expected (200 total).
- Required Ubuntu suite from the exact archive: 200/200 passed with zero failures and zero skips.
- Exact archive: version 0.59.0, task schema 2, SHA-256 `6a4cfeb503a1aa4683f4a72bd12a898ebfccc50bf8e284ed2529efadc95c59a2`.
- GitHub Actions: pending.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains the verified 0.55.0/task schema 2 baseline with starts 39. The cumulative 0.59.0 archive is staged privately at `/home/c0d3x/agentd-large-review-commit.tar.gz`. The managed launcher `/home/c0d3x/agentd-update-resources.sh` has SHA-256 `c02eca6a8c6a1c5bafe1345da34a054949584b8a11b33a281f9606263ef8f622` and remains unexecuted. Schema remains 2; rollback still requires the matching managed application/task-state backup and separately preserved native profiles.

## Constraints and known issues

Coverage records are trusted private daemon state and are accepted only through owner-bound, fingerprint-recomputing routes. They prove explicit actions against exact content, not reading quality. Files beyond the global pagination ceiling, or files rejected by binary/sensitive-data scanning, cannot satisfy coverage and cannot proceed. Evidence records remain in scope for future retention reconciliation.

## Next steps

The next security item should narrow GitHub account consent and publishing permissions so repository import, feedback reads and draft-PR writes expose the smallest clear scopes in the GUI. GUI administration, hard retention quotas, notifications and independent review of the stacked release remain queued.

