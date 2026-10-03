# 2026-10-03 — 0.602.0: Dialog Escape and backdrop dismiss (UX-1)

- Author/agent: Cursor
- Requested outcome: Close modal dialogs via Escape or outside click unless there are unsaved changes
- Status: implemented
- Release: 0.602.0

## Changes and relevant files

- `public/ui.js`: `requestCloseDialog`, dirty helpers, backdrop/Escape binding in `openDialog`.
- `public/app.js`: close buttons and mutable forms use dismiss helpers.
- `test/ui.test.mjs`: dirty confirm and backdrop dismiss coverage.

## Validation evidence

- `node --test test/ui.test.mjs`

## Next steps

1. Live-install 0.602.0.
2. Phase 2: composer agent/mode/model/effort UX.
