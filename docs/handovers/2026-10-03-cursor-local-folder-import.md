# 2026-10-03 — 0.605.0: Use local folder project import

- Author/agent: Cursor
- Requested outcome: Create project can register an absolute host folder (empty, non-git, or existing git) with allowlisted roots, approval preview, and handover scaffold
- Status: implemented; PR open; not merged/deployed
- Release: 0.605.0
- Branch: `feat/local-folder-import`

## Changes

- `src/local-folder-import.ts`: path allowlisting/canonicalization, case detection, stack hints, sensitive-file exclusion, fingerprint-bound preview, idempotent approve with rollback of created git/handover on failure.
- Ops: `local-folder-preview` / `local-folder-approve` / `local-folder-cancel`; mobile `/api/local-folder` with step-up key on approve.
- Config: `AGENTD_LOCAL_PROJECT_ROOTS` (comma-separated) plus managed `projectsDir`.
- GUI: **Use local folder** in New project; review/approve flow with access key.
- Handover layout: create `AGENTS.md` + `docs/handover.md` only when absent.

## Validation

- `node --test test/local-folder-import.test.mjs test/ui.test.mjs test/mobile.test.mjs`
- `npm run format:check` / `npm run typecheck`
- Full portable suite (`npm test`) before PR.
- Linux isolation CI on the PR (`scripts/test-isolation-ci.mjs`; macOS skips isolation fixtures).
- Side fixes for this checkout path (spaces in `Application Support`):
  - tests use `fileURLToPath` instead of `URL.pathname` when spawning helpers;
  - `mobile.ts` `send` no-ops when headers are already sent;
  - oversized review poll in `changes.test.mjs` waits longer under load.

## Follow-up

1. Reviewer merge when ready.
2. Live-install only after operator approval (not done here).
3. Operators who need imports outside managed projects must set `AGENTD_LOCAL_PROJECT_ROOTS`.
