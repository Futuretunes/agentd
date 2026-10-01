# 2026-09-30 — 0.554.0: Focus scroll margin (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Focus scroll margin
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.554.0
- Implementation commit(s): 61f3b7f
- PR: #1042

## Changes and relevant files

- See feature PR #1042.
- Package 0.554.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1042; live-installed on 192.168.1.20 (0.554.0 / 61f3b7f5841eb551f224129b0ffaa75d9e9c93de).
- Archive SHA-256: `2ba428ef6a89a99c279005d536f51d1007eeaa250d7f44db3a181797d7966f9c`
- Revision: `61f3b7f5841eb551f224129b0ffaa75d9e9c93de`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1042.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1042 and live-installed 0.554.0.
2. Continue a11y form labels.
