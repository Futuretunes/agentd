# 2026-09-30 — 0.119.0: History and New project field focus (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: Opening Search & history or New project should put keyboard focus in the primary field immediately
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.119.0
- Branch and base: `feat/gui-history-focus` on `main` (0.118.0)
- Implementation commit(s): f5707e2
- PR: #179

## Changes and relevant files

- `#history-query` has `autofocus`; opening history focuses the search field.
- Opening New project focuses `#project-input`.
- Package 0.119.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #179; live-installed on 192.168.1.20 (0.119.0 / cdf36c5).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.118.0 / revert of #179.

## Constraints and known issues

- Focus restore on close still uses `openDialog` return focus to the opener.

## Next steps

1. Done: merged #179 and live-installed 0.119.0.
2. Continue UX polish or admin slices as operator priority allows.
