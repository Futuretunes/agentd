# 2026-09-30 — 0.88.0: Auto-dismiss notices (UX-1 / U14)

- Author/agent: Cursor
- Requested outcome: Notices/toasts auto-dismiss so they do not linger behind dialogs; keep errors readable; raise toast above open dialogs
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.88.0
- Branch and base: `feat/gui-notice-dismiss` on `main` (0.87.0)
- Implementation commit(s): 518da5b
- PR: #117

## Changes and relevant files

- `noticeDismissMs` in `public/ui.js`: 5s for info/success, 8s for errors.
- `notice()` in `public/app.js` schedules clear, classifies likely errors, and still prefers in-dialog `.dialog-notice` when a dialog is open.
- `#notice` z-index raised above dialogs; light styling for non-error toasts.
- Package 0.88.0; unit coverage for dismiss timings.

## Validation evidence

- CI green on #117; live-installed on 192.168.1.20 (0.88.0 / 4b5fa7215bde).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.87.0 / revert of #117.

## Constraints and known issues

- Heuristic error detection from message text; callers can still pass `notice(text, "error")`.
- Persistent inline field errors elsewhere are unchanged.

## Next steps

1. Done: merged #117 and live-installed 0.88.0.
2. Remaining UX-1: approval-card distillation / dictate honesty as separately scoped work.
