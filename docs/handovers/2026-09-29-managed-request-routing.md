# 2026-09-29 — Explicit routing for extracted managers

- Author/agent: Codex
- Requested outcome: continue AgentD backlog work after the 0.49.0 cumulative baseline.
- Status: implemented, exact archive verified and Linux validated; not installed or merged.
- Release: 0.50.0, task schema 2.
- Branch and base: `refactor/managed-request-routing` from `release/0.49.0-reviewed-baseline`.
- Implementation commit: `268e28ad2a31a15b66aa1cf00cc2d989e2fe9405`.
- PR: https://github.com/Futuretunes/agentd/pull/54, ready for review against the cumulative baseline.

## Changes and relevant files

`src/request-routing.ts` now declares one route owner for publication/feedback, dependency preparation, GitHub account, repository and native account operations. `src/runner.ts` dispatches those operations through a dedicated managed-operation handler instead of letting them fall through the core request chain. The existing preparation mutation exclusion became one shared guard called by both managed and core handlers. This retains the previous directional compatibility rules and keeps read/status/cancel behavior unchanged.

The explicit table includes the local `feedback-preview` compatibility operation in addition to the browser protocol names. Its initial omission was caught by the publication shutdown tests before commit; adding it restored the historical local/admin contract. Duplicate route ownership still fails while constructing the runner.

## Validation evidence

- `npm run typecheck`: passed.
- `npm run format:check`: passed.
- Focused request routing: 4/4 passed.
- Focused publication lifecycle after compatibility correction: 12/12 passed.
- macOS full suite: 180 passed, 0 failed; nine Linux-only tests skipped as expected.
- GitHub Actions runs `36551696108` and `36551742641`: Node 24, Node 26 and Required Linux isolation passed.
- Required Ubuntu 24.04 isolation: 189/189 passed, zero failures and zero skips.
- Exact deterministic archive: version 0.50.0, format 1, task schema 2; SHA-256 `2b3268319156e18d6ab959b33ac4f5baead9c5c23b3f9b8776e231406feeda9e`.

No live model task, account consent, GitHub publication through AgentD, cleanup, deployment, main merge or tag was performed.

## Deployment and rollback

Production remains 0.43.0/task schema 2. Candidate 0.50.0 is cumulative with the reviewed 0.49.0 baseline. The exact archive and launcher are staged privately after this handover; the launcher remains an operator-only, unexecuted action. Schema remains 2, so rollback requires matching application and task-state backup while preserving native profiles separately.

## Constraints and known issues

This is structural routing work, not a concurrency relaxation or new account authority. Manager implementations still own lifecycle and cancellation. Browser gateway authority remains independently allowlisted. The core handler still owns settings, operations/status, projects/conversations and task actions. PR #53 remains the main-targeted baseline; #54 is one focused follow-up and must not be merged to `main` independently.

## Next steps

Continue one bounded route domain at a time. The safest next slice is read-only operations/workspace routing because it can be assigned explicitly without moving mutation admission or task approval behavior. R8 narrower GitHub authorization, R14 structured binary/large-file review, GUI administration and retention quotas remain product/security backlog items. Keep #53's independent review and explicit merge/tag decision separate.
