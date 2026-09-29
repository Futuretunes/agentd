# 2026-09-29 — Complete explicit request routing

- Author/agent: Codex
- Requested outcome: continue backlog work after task routing.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.55.0, task schema 2.
- Branch and base: `refactor/support-routing` from `refactor/task-routing`.
- Implementation commit: `1a6d7dc3ccc665368339c5d2113efea0d71840c6`.
- PR: https://github.com/Futuretunes/agentd/pull/59, draft against PR #58's branch pending final CI and review.

## Changes and relevant files

Attachment upload/read, execution-settings view/save, native model refresh and storage preview/cleanup now dispatch through a dedicated support route in `src/request-routing.ts` and `src/runner.ts`. Existing storage owner/fingerprint admission, free-space reserve checks, settings validation/transactions, per-adapter editing ceilings and pending-approval refresh behavior are unchanged. Storage cleanup remains explicitly approved; no cleanup ran during validation.

Every supported operation now has one startup-validated route owner. The fallback handles only malformed or unknown input and preserves the prior mutation-exclusion check and fail-closed unknown-operation result.

## Validation evidence

- Typecheck and formatting passed.
- Focused routing/settings/image/storage/task tests: 42/42 passed.
- macOS full suite: 185 passed, 0 failed; nine Linux-only tests skipped as expected.
- Required Ubuntu suite from the exact archive: 194/194 passed with zero failures and zero skips.
- Exact archive: version 0.55.0, task schema 2, SHA-256 `bcfd941d9a0770cf336402d5c3bec51cad406eb0ca2c105478e6a67c2ef2f829`.
- GitHub Actions is pending for the documentation-complete branch and must pass before the PR is marked ready.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains 0.43.0/task schema 2. The cumulative 0.55.0 archive and launcher are staged privately but unexecuted. Schema remains 2; rollback still requires the matching application/task-state backup and separately preserved native profiles.

## Constraints and known issues

This completes operation-to-route ownership, but it does not finish broader module decomposition inside each handler. PR #59 is the latest child of #58–#53; do not merge a child directly to `main`.

## Next steps

After CI and review, mark #59 ready. Review the completed 0.49–0.55 routing stack as one baseline and decide whether to fold it into main-targeted #53 before continuing larger product items. Next product priorities remain R8 narrower GitHub consent, R14 binary/large-file review, GUI administration, retention quotas and notifications.
