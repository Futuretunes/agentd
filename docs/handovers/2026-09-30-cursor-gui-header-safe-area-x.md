# 2026-09-30 — 0.192.0: Phone conversation header horizontal safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone conversation header must clear left and right safe-area insets
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.192.0
- Branch and base: `feat/gui-header-safe-area-x` on `main` (0.191.0)
- Implementation commit(s): 0bd998c
- PR: #325

## Changes and relevant files

- Phone `header` padding uses `max(12px, env(safe-area-inset-left|right))`.
- Package 0.192.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #325; live-installed on 192.168.1.20 (0.192.0 / 0bd998c).
- Archive SHA-256: `c4dddd01bb78b12be023dbb82ba37b5cb42f4cc04ca45904c7badfd42c507cfa`
- Revision: `0bd998c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.191.0 / revert of #325.

## Constraints and known issues

- Complements existing header top safe-area inset (0.128.0).

## Next steps

1. Done: merged #325 and live-installed 0.192.0.
2. Continue phone notice toast / review footer horizontal safe-area polish.
