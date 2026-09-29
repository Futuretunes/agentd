# 2026-09-29 — Explicit workspace-read routing

- Author/agent: Codex
- Requested outcome: continue the backlog after service-read routing.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.52.0, task schema 2.
- Branch and base: `refactor/workspace-read-routing` from `refactor/service-read-routing`.
- Implementation commit: `742eec8dad8292d43f2515724bcbbf42964191b7`.
- PR: https://github.com/Futuretunes/agentd/pull/56, ready for review against PR #55's branch.

## Changes and relevant files

Active and archived project lists, conversation history/search, project conversations, paginated conversation detail and local task listing now dispatch through a dedicated workspace-read route in `src/request-routing.ts` and `src/runner.ts`. The SQL queries, validation, output bounds and attachment lookups are unchanged. Project, conversation and task mutations remain in the guarded core path. Startup still rejects duplicate route ownership, and unknown operations still fail closed through core validation.

## Validation evidence

- Typecheck and formatting passed.
- Focused routing/projects/runner tests: 26/26 passed.
- macOS full suite: 182 passed, 0 failed; nine Linux-only tests skipped as expected.
- Required Ubuntu suite from the exact archive: 191/191 passed with zero failures and zero skips.
- Exact archive: version 0.52.0, task schema 2, SHA-256 `8e2d490af47012cf2cb51634c0f71978a962b913a307518c20f123cad552dc6d`.
- GitHub Actions runs `36553680128` and `36553686948`: Node 24, Node 26 and Required Linux isolation passed.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains 0.43.0/task schema 2. The cumulative 0.52.0 archive and launcher are staged privately but unexecuted. Schema remains 2; rollback still requires the matching application/task-state backup and separately preserved native profiles.

## Constraints and known issues

This is an internal dispatch refactor. It does not broaden browser authority, change read results, or turn reads into admission bypasses for mutations. PR #56 depends on #55, #54 and the main-targeted #53 baseline; do not merge a child directly to `main`.

## Next steps

The next bounded request-routing slice is project and conversation mutations, followed separately by task reads/actions and attachment/settings/storage operations. Larger product backlog remains R8 narrower GitHub consent, R14 binary/large-file review, GUI administration, retention quotas and notifications.
