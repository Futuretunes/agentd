# 2026-09-29 — Durable exact-tree large-review acknowledgements

- Author/agent: Codex
- Requested outcome: continue the backlog after bounded per-file large-review inspection.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.57.0, task schema 2.
- Branch and base: `feat/durable-large-review-acknowledgements` from `feat/bounded-large-review`.
- Implementation commit: `8117de5352e73b7d94dc23c599302940531ac69c`.
- PR: pending against PR #61's branch.

## Changes and relevant files

Large aggregate text reviews now require a separate, explicit **Mark file reviewed** action after each bounded patch is loaded. `src/changes.ts` fingerprints the exact tree, literal filename and returned patch. `src/runner.ts` recomputes that fingerprint before accepting an acknowledgement, binds the request to the authenticated owner and live preview, writes an audit event, and restores completed files for later previews. `src/review-acknowledgements.ts` stores only the tree, filename and fingerprint in the existing durable review-job table; it never stores a second patch or credential content. `public/app.js` shows durable progress and distinguishes loading a patch from explicitly reviewing it.

Acknowledgements are task- and tree-specific, idempotent, survive database/service restart, and do not transfer to a changed snapshot. The gateway validates the exact tree and fingerprint. The HTTPS process replaces caller-supplied ownership with its authenticated session owner.

This slice records review evidence only. Even when every file is acknowledged, oversized aggregate reviews remain ineligible for commit, revision and restart. Binary, sensitive, unscannable and individually oversized files remain blocked. No approval gate was weakened.

## Validation evidence

- Typecheck and formatting passed.
- Focused acknowledgement, review, gateway, mobile and UI tests passed.
- macOS full suite: 188 passed, 0 failed; nine Linux-only tests skipped as expected.
- Required Ubuntu suite from the exact archive: 197/197 passed with zero failures and zero skips.
- Exact archive: version 0.57.0, task schema 2, SHA-256 `d14e948211a751341ee77629313f11eeb5f8b5de8cbba398c1e0452f86b81952`.
- GitHub Actions is pending for the documentation-complete branch.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains the verified 0.55.0/task schema 2 baseline with starts 39. The cumulative 0.57.0 archive is staged privately at `/home/c0d3x/agentd-durable-large-review.tar.gz`; the managed launcher `/home/c0d3x/agentd-update-resources.sh` has SHA-256 `a043055aef292cb67165b276ea23fba19caac71063ebf6a3d233cf4048712e00` and remains unexecuted. Schema remains 2; rollback still requires the matching managed application/task-state backup and separately preserved native profiles.

## Constraints and known issues

An explicit acknowledgement records the operator's action and exact content fingerprint; it cannot prove how carefully the human read the patch. Acknowledgements intentionally do not authorize a commit. One individually oversized text file still needs bounded pagination. Existing records are small but currently share the durable `review_jobs` table and should be included in future task-retention reconciliation.

## Next steps

After CI and review, mark the PR ready. The next R14 slice should add bounded pagination for one oversized text file, with stable page identities and complete coverage evidence. Only after both per-file and paginated coverage are durable should a separate design consider authorizing checks/commit for a fully reviewed large snapshot. R8 GitHub consent narrowing, GUI administration, retention quotas and notifications remain queued.
