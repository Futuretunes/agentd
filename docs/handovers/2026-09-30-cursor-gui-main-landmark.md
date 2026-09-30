# 2026-09-30 — 0.130.0: Main desk landmark name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: The conversation `<main>` landmark must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.130.0
- Branch and base: `feat/gui-main-landmark` on `main` (0.129.0)
- Implementation commit(s): c4bbfe6
- PR: #201

## Changes and relevant files

- `main.desk` sets `aria-label="Conversation workspace"`.
- Package 0.130.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #201; live-installed on 192.168.1.20 (0.130.0 / 775cd34).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.129.0 / revert of #201.

## Constraints and known issues

- Sidebar already has its own navigation landmark.

## Next steps

1. Done: merged #201 and live-installed 0.130.0.
2. Continue UX polish or admin slices as operator priority allows.
