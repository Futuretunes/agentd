# 2026-09-30 — 0.563.0: Phone logout touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone logout touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.563.0
- Implementation commit(s): 8f18170
- PR: #1060

## Changes and relevant files

- See feature PR #1060.
- Package 0.563.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1060; live-installed on 192.168.1.20 (0.563.0 / 8f1817063cbff9cc7662c4f88f427a5fcbf1207f).
- Archive SHA-256: `f363e00406daa093c9344c268232b3ce0a9d794bc55eca297995fd1a2f50bd12`
- Revision: `8f1817063cbff9cc7662c4f88f427a5fcbf1207f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1060.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1060 and live-installed 0.563.0.
2. Continue a11y form labels.
