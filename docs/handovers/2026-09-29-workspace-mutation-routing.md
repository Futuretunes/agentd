# 2026-09-29 — Explicit workspace-mutation routing

- Author/agent: Codex
- Requested outcome: continue backlog work after workspace-read routing.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.53.0, task schema 2.
- Branch and base: `refactor/workspace-mutation-routing` from `refactor/workspace-read-routing`.
- Implementation commit: `100b5fa4eb426dea56da8f529cdfae9ee8b5ee10`.
- PR: https://github.com/Futuretunes/agentd/pull/57, draft against PR #56's branch pending final CI and review.

## Changes and relevant files

Project check configuration, local project creation/registration, project archive/restore/rename and conversation archive/restore/rename now dispatch through a dedicated workspace-mutation route in `src/request-routing.ts` and `src/runner.ts`. Existing busy-state checks, Git validation, transaction/audit behavior and archive safety checks are unchanged. Creation receipt inspection is shared with the remaining task-creation core path, preserving same-session exactly-once recovery for an uncertain project creation response.

Task creation, approval, cancellation and other task actions remain in the core path. Route ownership remains startup-validated and unknown operations still fail closed.

## Validation evidence

- Typecheck and formatting passed.
- Focused routing/projects/creation/runner/audit tests: 31/31 passed.
- macOS full suite: 183 passed, 0 failed; nine Linux-only tests skipped as expected.
- Required Ubuntu suite from the exact archive: 192/192 passed with zero failures and zero skips.
- Exact archive: version 0.53.0, task schema 2, SHA-256 `710ff1d3d0331f478247282879938221829b3b37ae5a6ad98ff6c6e42c1298f7`.
- GitHub Actions is pending for the documentation-complete branch and must pass before the PR is marked ready.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains 0.43.0/task schema 2. The cumulative 0.53.0 archive and launcher are staged privately but unexecuted. Schema remains 2; rollback still requires the matching application/task-state backup and separately preserved native profiles.

## Constraints and known issues

This is an internal dispatch refactor and does not grant new browser operations. PR #57 depends on #56, #55, #54 and the main-targeted #53 baseline; do not merge a child directly to `main`.

## Next steps

After CI and review, mark #57 ready. The next bounded request-routing slice is task reads/actions, followed separately by attachment/settings/storage operations. Larger product backlog remains R8 narrower GitHub consent, R14 binary/large-file review, GUI administration, retention quotas and notifications.
