# 2026-09-30 — 0.349.0: Adapter policy approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Adapter policy approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.349.0
- Implementation commit(s): 56cff5b
- PR: #639

## Changes and relevant files

- See feature PR #639.
- Package 0.349.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #639; live-installed on 192.168.1.20 (0.349.0 / 56cff5b28ab38d21b5778a1a6c7b079c99c41314).
- Archive SHA-256: `ae77e45ecacb7474513cd511da5a2fd96822d131baeb11b68ce4fa872ba4641f`
- Revision: `56cff5b28ab38d21b5778a1a6c7b079c99c41314`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #639.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #639 and live-installed 0.349.0.
2. Continue a11y form labels.
