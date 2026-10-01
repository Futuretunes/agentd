# 2026-09-30 — 0.350.0: Signed-in origin approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Signed-in origin approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.350.0
- Implementation commit(s): f9bc46f
- PR: #641

## Changes and relevant files

- See feature PR #641.
- Package 0.350.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #641; live-installed on 192.168.1.20 (0.350.0 / f9bc46fa539394d4e3586e9a9730a022534d64fa).
- Archive SHA-256: `ae77e45ecacb7474513cd511da5a2fd96822d131baeb11b68ce4fa872ba4641f`
- Revision: `f9bc46fa539394d4e3586e9a9730a022534d64fa`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #641.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #641 and live-installed 0.350.0.
2. Continue a11y form labels.
