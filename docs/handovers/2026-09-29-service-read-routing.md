# 2026-09-29 — Explicit service-read routing

- Author/agent: Codex
- Requested outcome: continue backlog work after managed-operation routing.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.51.0, task schema 2.
- Branch and base: `refactor/service-read-routing` from `refactor/managed-request-routing`.
- Implementation commit: `faf9642f715d6987af656e355fd219a2aaec9c7f`.
- PR: https://github.com/Futuretunes/agentd/pull/55, draft against PR #54's branch.

## Changes and relevant files

`capabilities`, `operations` and the local administrator `audit` read now dispatch through an explicit service-read route in `src/request-routing.ts` and `src/runner.ts`. The handler contains the unchanged capability, account/version/usage, resource and task-summary reads. It does not pass through mutation admission and cannot overlap the managed or review-preparation route tables. Unknown operations still reach the core fail-closed path. The route test proves ownership is disjoint.

## Validation evidence

- Typecheck and formatting passed.
- Focused routing/projects/runner tests: 25/25 passed.
- macOS full suite: 181 passed, 0 failed; nine Linux-only tests skipped as expected.
- GitHub Actions runs `36552553525` and `36552598657`: Node 24, Node 26 and Required Linux isolation passed.
- Required Ubuntu suite: 190/190 passed with zero failures and zero skips.
- Exact archive: version 0.51.0, task schema 2, SHA-256 `9bee09bf18adcf385e31aecc9011f3fdc1d04ca8403467f8d044571b1a0cff6e`.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains 0.43.0/task schema 2. The cumulative 0.51.0 archive and launcher are staged privately but unexecuted. Schema remains 2; rollback still requires the matching application/task-state backup and separately preserved native profiles.

## Constraints and known issues

This changes internal dispatch structure only. It does not expose `audit` through the browser gateway or change returned data. PR #55 depends on #54, which depends on the main-targeted #53 baseline; do not merge a child directly to `main`.

## Next steps

The next bounded routing slice is project/conversation read operations, followed separately by their mutations and task actions. Larger product backlog remains R8 narrower GitHub consent, R14 binary/large-file review, GUI administration, retention quotas and notifications. Keep independent review/merge decisions for #53–#55 explicit.
