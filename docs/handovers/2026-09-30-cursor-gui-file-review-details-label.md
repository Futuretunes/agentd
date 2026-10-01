# 2026-09-30 — 0.399.0: File review disclosure accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: File review disclosure accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.399.0
- Implementation commit(s): 2db2e90
- PR: #738

## Changes and relevant files

- See feature PR #738.
- Package 0.399.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #738; live-installed on 192.168.1.20 (0.399.0 / 2db2e901b75ba5b8aa7ee64505c3456157cd3dd5).
- Archive SHA-256: `61f5bba43910b9710f6be6f04eae6c40a727ecd7fbf8e3a1c5a9184170d0b938`
- Revision: `2db2e901b75ba5b8aa7ee64505c3456157cd3dd5`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #738.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #738 and live-installed 0.399.0.
2. Continue a11y form labels.
