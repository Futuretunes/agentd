# 2026-09-30 — 0.592.0: Phone notice font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone notice font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.592.0
- Implementation commit(s): 71c3bd6
- PR: #1118

## Changes and relevant files

- See feature PR #1118.
- Package 0.592.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1118; live-installed on 192.168.1.20 (0.592.0 / 71c3bd62ff6858302fa564012f3300fbe36fafd9).
- Archive SHA-256: `e04bf187e5326aedb73986ec9fea4f819ce0f5c9d069e74fb7dd690e269f3425`
- Revision: `71c3bd62ff6858302fa564012f3300fbe36fafd9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1118.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1118 and live-installed 0.592.0.
2. Continue a11y form labels.
