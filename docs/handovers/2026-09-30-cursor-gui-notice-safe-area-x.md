# 2026-09-30 — 0.193.0: Phone notice toast horizontal safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone page notice toast must clear left and right safe-area insets
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.193.0
- Branch and base: `feat/gui-notice-safe-area-x` on `main` (0.192.0)
- Implementation commit(s): ebb0c77
- PR: #327

## Changes and relevant files

- Phone `#notice` max-width subtracts left/right safe-area insets.
- Package 0.193.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #327; live-installed on 192.168.1.20 (0.193.0 / ebb0c77).
- Archive SHA-256: `70b21c6b910b3e9620ac27833f97727622c9e92842ace2671a106cf2ac285857`
- Revision: `ebb0c77`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.192.0 / revert of #327.

## Constraints and known issues

- Complements existing notice bottom safe-area inset (0.151.0).

## Next steps

1. Done: merged #327 and live-installed 0.193.0.
2. Continue phone review sticky footer horizontal safe-area polish.
