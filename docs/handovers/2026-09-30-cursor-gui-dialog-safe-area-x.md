# 2026-09-30 — 0.191.0: Phone dialog horizontal safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone sheet dialogs must clear left and right safe-area insets
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.191.0
- Branch and base: `feat/gui-dialog-safe-area-x` on `main` (0.190.0)
- Implementation commit(s): 8c0b657
- PR: #323

## Changes and relevant files

- Phone `dialog` padding uses `max(16px, env(safe-area-inset-left|right))`.
- Package 0.191.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #323; live-installed on 192.168.1.20 (0.191.0 / 8c0b657).
- Archive SHA-256: `13f0866da38d65a9f7e99b42048340a8d75d9552cab53418c4c6aa2de0ce2748`
- Revision: `8c0b657`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.190.0 / revert of #323.

## Constraints and known issues

- Complements existing dialog bottom safe-area inset.

## Next steps

1. Done: merged #323 and live-installed 0.191.0.
2. Continue phone header horizontal safe-area polish.
