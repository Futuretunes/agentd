# 2026-09-30 — 0.105.0: Dialog focus restoration (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Closing a modal returns keyboard focus to the control that opened it
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.105.0
- Branch and base: `feat/gui-dialog-focus-restore` on `main` (0.104.0)
- Implementation commit(s): 8a4b81e
- PR: #151

## Changes and relevant files

- `openDialog` in `public/ui.js` remembers the trigger and restores focus on `close`.
- All `showModal` call sites in `public/app.js` go through `openDialog`.
- Package 0.105.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #151; live-installed on 192.168.1.20 (0.105.0 / 843d0ea).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.104.0 / revert of #151.

## Constraints and known issues

- Re-opening an already-open dialog does not overwrite the stored trigger (refresh-safe).
- Focus restore skips triggers no longer in the document.

## Next steps

1. Done: merged #151 and live-installed 0.105.0.
2. Continue UX polish or admin slices as operator priority allows.
