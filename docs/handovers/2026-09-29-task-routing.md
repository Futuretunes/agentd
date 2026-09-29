# 2026-09-29 — Explicit task-lifecycle routing

- Author/agent: Codex
- Requested outcome: continue backlog work after workspace-mutation routing.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.54.0, task schema 2.
- Branch and base: `refactor/task-routing` from `refactor/workspace-mutation-routing`.
- Implementation commit: `5c48c821009df00c029771384d74c83288e0332e`.
- PR: https://github.com/Futuretunes/agentd/pull/58, draft against PR #57's branch pending final CI and review.

## Changes and relevant files

Task creation, revision/restart compatibility calls, retry, task output/detail, review/validation, discard/commit, approval and cancellation now dispatch through a dedicated task route in `src/request-routing.ts` and `src/runner.ts`. Existing durable creation receipts, approval fingerprints, exact-content checks, audit records, adapter policy, queue transitions and cancellation behavior are unchanged. The route owns the complete task lifecycle while asynchronous review/check/commit/revision/restart preparation retains its earlier dedicated route.

## Validation evidence

- Typecheck and formatting passed.
- Focused routing/task/project/creation/change tests: 39/39 passed.
- macOS full suite: 184 passed, 0 failed; nine Linux-only tests skipped as expected.
- Required Ubuntu suite from the exact archive: 193/193 passed with zero failures and zero skips.
- Exact archive: version 0.54.0, task schema 2, SHA-256 `07a839df9618f82d3f4b727804b0de113a8933544ac498268ab3a91384636c2a`.
- GitHub Actions is pending for the documentation-complete branch and must pass before the PR is marked ready.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains 0.43.0/task schema 2. The cumulative 0.54.0 archive and launcher are staged privately but unexecuted. Schema remains 2; rollback still requires the matching application/task-state backup and separately preserved native profiles.

## Constraints and known issues

This is internal request ownership only and grants no new browser authority. PR #58 is the latest child of #57–#53; do not merge a child directly to `main`.

## Next steps

After CI and review, mark #58 ready. The final core-routing slice is attachment/settings/storage operations. After that, reassess whether the smaller core is ready to become an explicit route instead of a fallback. Larger product backlog remains R8 narrower GitHub consent, R14 binary/large-file review, GUI administration, retention quotas and notifications.
