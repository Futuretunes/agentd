# 2026-09-30 — 0.194.0: Phone review footer horizontal safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone review sticky footer must clear left and right safe-area insets
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.194.0
- Branch and base: `feat/gui-review-actions-safe-area-x` on `main` (0.193.0)
- Implementation commit(s): 0b50e15
- PR: #329

## Changes and relevant files

- Phone `#review-actions` padding uses `max(16px, env(safe-area-inset-left|right))`.
- Package 0.194.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #329; live-installed on 192.168.1.20 (0.194.0 / 0b50e15).
- Archive SHA-256: `4881f1d121eec96e17b4b5552de00a3ff0d0c0f3993f3a014ae765cc3b2ea62e`
- Revision: `0b50e15`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.193.0 / revert of #329.

## Constraints and known issues

- Complements existing review footer bottom safe-area inset (0.121.0).

## Next steps

1. Done: merged #329 and live-installed 0.194.0.
2. Continue phone drawer right safe-area polish.
