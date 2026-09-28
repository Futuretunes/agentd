# 2026-09-28 — Durable task/project creation requests

- Author: Codex; overnight R10, creation-recovery portion.
- Branch: `feat/durable-creation-requests` from `feat/followup-context` at `75d7a16`.
- Release: cumulative 0.32.0; **task schema 2**, metadata schema 1. Not installed; production remains 0.22.0/task schema 1.

## Changes

`creation-requests.ts` binds a session/local scope and UUID request ID to a canonical payload hash and resulting task/project. Receipt insertion and SQL creation share a transaction; a unique key prevents duplicate committed results. Matching replays return the original result, while changed work with the same ID is refused. The browser `request-id.js` persists pending requests before sending, reuses them across refresh, and requires an explicit choice before treating edited uncertain input as new work. Gateway requires creation IDs; stale clients must refresh. Private administrator callers remain compatible without IDs.

`task-database.ts` validates version 1 before applying the explicit version-2 receipt migration. Recovery failures roll back schema, data and version. Version-2 receipt structure is checked exactly and never silently repaired. See `docs/creation-recovery.md` for scope, session expiry, retention and rollback limits.

## Validation

15 focused tests passed: duplicate task/conversation/project prevention, reordered equivalent input, restart recovery, changed input refusal, failed input correction, session scope, receipt uniqueness/rollback, browser response-loss staging, storage failure and explicit different-work confirmation. Actual gateway replay reuses the same task. Migration tests cover version-1 recovery rollback, successful upgrade and refusal to repair missing current receipts. Typecheck passed. Exact archive `f71f0f54399a94dbedb792f1c93cbac74313efe7` (see Git for the full revision) passed 136/136 required Linux tests with zero skips and typecheck. Archive SHA-256: `cc84db4ebea7727409cc07fd0be0b01fd8e5922ed8db2c84f53c294a7e6d160b`. CI run 36483656873 is pending. No production or model/account/publication operations.

## Deployment and next

Use the eventual cumulative managed archive and explicit resource profile migration. This is the first overnight candidate that upgrades task schema to 2. Old code alone is not a rollback; use matching pre-update state and application, preserving native account profiles. Installation remains an administrator step; do not re-adopt drift.

R10 remains partial: long Git work is still synchronous and remaining mutations need a recovery/idempotency audit. Next: standalone formatting/tooling (R2) to make that extraction reviewable, then asynchronous preparation. Keep pending evidence and exact archive hashes in the shared handover.
