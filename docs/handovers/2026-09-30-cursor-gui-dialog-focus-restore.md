# 2026-09-30 — 0.105.0: Dialog focus restoration (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Closing a modal returns keyboard focus to the control that opened it
- Status: implemented
- Release: 0.105.0
- Branch and base: `feat/gui-dialog-focus-restore` on `main` (0.104.0)
- Implementation commit(s): 8a4b81e
- PR: (filled after open)

## Changes and relevant files

- `openDialog` in `public/ui.js` remembers the trigger and restores focus on `close`.
- All `showModal` call sites in `public/app.js` go through `openDialog`.
- Package 0.105.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Re-opening an already-open dialog does not overwrite the stored trigger (refresh-safe).
- Focus restore skips triggers no longer in the document.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
