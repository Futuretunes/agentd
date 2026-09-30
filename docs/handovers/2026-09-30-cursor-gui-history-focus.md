# 2026-09-30 — 0.119.0: History and New project field focus (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: Opening Search & history or New project should put keyboard focus in the primary field immediately
- Status: implemented
- Release: 0.119.0
- Branch and base: `feat/gui-history-focus` on `main` (0.118.0)
- Implementation commit(s): 0dcab2b
- PR: #179

## Changes and relevant files

- `#history-query` has `autofocus`; opening history focuses the search field.
- Opening New project focuses `#project-input`.
- Package 0.119.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Focus restore on close still uses `openDialog` return focus to the opener.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
