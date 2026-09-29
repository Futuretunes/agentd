# 2026-09-29 — Consolidated request-routing baseline

- Author/agent: Codex
- Requested outcome: continue backlog work and keep review/handover state coherent.
- Status: implementation and exact release validated; consolidated for review, not installed or merged.
- Release: 0.55.0, task schema 2.
- Branch and base: `release/0.55.0-routing-baseline` against `main`.
- Exact implementation commit: `1a6d7dc3ccc665368339c5d2113efea0d71840c6`.
- PR: https://github.com/Futuretunes/agentd/pull/60, draft against `main` pending final consolidated CI and review.

## Changes and relevant files

The complete linear 0.49–0.55 stack is now presented in one main-targeted pull request. `src/request-routing.ts` assigns each supported operation to exactly one startup-validated domain: review preparation, extracted managers, service reads, workspace reads, workspace mutations, task lifecycle and support operations. `src/runner.ts` has a dedicated handler for each domain. Malformed or unknown input reaches the unchanged fail-closed fallback.

The bounded PRs #53–#59 preserve review history. PR #60 is the intended single merge candidate and should supersede them after consolidated CI succeeds; none has been merged.

## Validation evidence

- Exact 0.55.0 implementation archive: SHA-256 `bcfd941d9a0770cf336402d5c3bec51cad406eb0ca2c105478e6a67c2ef2f829`.
- Required Ubuntu suite from that archive: 194/194 passed, zero failures and zero skips.
- macOS full suite: 185 passed, 0 failed; nine Linux-only tests skipped as expected.
- Typecheck and formatting passed.
- Node 24/26 and required Linux CI passed for each bounded routing slice. Consolidated branch CI is pending.

No live model request, account consent, publication, cleanup, deployment, merge or tag occurred.

## Deployment and rollback

Production remains 0.43.0/task schema 2. The cumulative 0.55.0 archive and launcher are staged privately but unexecuted. A deployment must use the exact validated archive and managed updater; rollback still requires the matching application/task-state backup and separately preserved native profiles.

## Constraints and known issues

Explicit routing clarifies request ownership but does not by itself decompose all domain internals into separate modules. Independent review and an explicit merge/tag decision remain required. The protected production boundary, native subscription authentication, approval gates and adapter ceilings are unchanged.

## Next steps

Wait for consolidated CI, mark #60 ready, and close #53–#59 as superseded while retaining their history. Then perform independent review before any merge or deployment decision. After the release decision, resume the larger product backlog: R8 narrower GitHub consent, R14 binary/large-file review, GUI administration, retention quotas and notifications.
