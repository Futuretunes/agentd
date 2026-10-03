# 2026-10-03 — 0.603.0: Composer agent/mode/model/effort controls (UX-2)

- Author/agent: Cursor
- Requested outcome: Set agent, mode, model and effort in the chat picker in about two clicks; options follow the selected agent; project defaults remain one click away
- Status: implemented
- Release: 0.603.0

## Changes

- `public/index.html` / `public/app.js`: inline model and effort selects in `#run-picker`; agent-conditional catalog sync; Project defaults shortcut.
- `public/style.css`: phone touch targets for the new selects.

## Validation

- `node --test test/ui.test.mjs`
