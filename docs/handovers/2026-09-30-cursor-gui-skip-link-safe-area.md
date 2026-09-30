# 2026-09-30 — 0.211.0: Skip-link safe-area insets (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Skip link must clear top and left safe-area insets on notched phones
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.211.0
- Branch and base: `feat/gui-skip-link-safe-area` on `main` (0.210.0)
- Implementation commit(s): 1067edd
- PR: #363

## Changes and relevant files

- `.skip-link` uses `max(12px, env(safe-area-inset-left/top))` for placement.
- Package 0.211.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #363; live-installed on 192.168.1.20 (0.211.0 / 1067edd).
- Archive SHA-256: `a02d6ca96b82f01d900577b3b0f71b1a805a3beebe9eb421943f1a48692c4af3`
- Revision: `1067edd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.210.0 / revert of #363.

## Constraints and known issues

- Complements skip-link focus treatment from 0.107.0.

## Next steps

1. Done: merged #363 and live-installed 0.211.0.
2. Bound conversation menu panel height to the phone safe area next.
