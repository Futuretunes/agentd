# 2026-09-30 — 0.88.0: Auto-dismiss notices (UX-1 / U14)

- Author/agent: Cursor
- Requested outcome: Notices/toasts auto-dismiss so they do not linger behind dialogs; keep errors readable; raise toast above open dialogs
- Status: implemented
- Release: 0.88.0
- Branch and base: `feat/gui-notice-dismiss` on `main` (0.87.0)
- Implementation commit(s): (filled after commit)
- PR: (filled after open)

## Changes and relevant files

- `noticeDismissMs` in `public/ui.js`: 5s for info/success, 8s for errors.
- `notice()` in `public/app.js` schedules clear, classifies likely errors, and still prefers in-dialog `.dialog-notice` when a dialog is open.
- `#notice` z-index raised above dialogs; light styling for non-error toasts.
- Package 0.88.0; unit coverage for dismiss timings.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Heuristic error detection from message text; callers can still pass `notice(text, "error")`.
- Persistent inline field errors elsewhere are unchanged.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Remaining UX-1: approval-card distillation / dictate honesty as separately scoped work.
