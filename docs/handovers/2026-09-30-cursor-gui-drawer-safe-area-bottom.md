# 2026-09-30 — 0.136.0: Phone drawer safe-area-bottom (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Phone navigation drawer must clear the home-indicator safe area
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.136.0
- Branch and base: `feat/gui-drawer-safe-area-bottom` on `main` (0.135.0)
- Implementation commit(s): 2c28172
- PR: #212

## Changes and relevant files

- Phone `#sidebar` padding-bottom uses `max(14px, env(safe-area-inset-bottom))`.
- Package 0.136.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #212; live-installed on 192.168.1.20 (0.136.0 / 2c28172).
- Archive SHA-256: `bf89c4f826c6d41272ba46d647d098f0118c4b57839edbde36c6d1da1ccae077`
- Revision: `2c28172258390bb4eb6d03af5cbf5aa2803c6fb1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.135.0 / revert of #212.

## Constraints and known issues

- Complements existing drawer safe-area-top padding from 0.117.0.

## Next steps

1. Done: merged #212 and live-installed 0.136.0.
2. Continue UX polish or admin slices as operator priority allows.
