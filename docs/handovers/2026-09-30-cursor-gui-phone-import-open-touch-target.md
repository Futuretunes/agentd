# 2026-09-30 — 0.576.0: Phone import-open touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone import-open touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.576.0
- Implementation commit(s): c53cf11
- PR: #1086

## Changes and relevant files

- See feature PR #1086.
- Package 0.576.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1086; live-installed on 192.168.1.20 (0.576.0 / c53cf113fdcf0b6d81b0e9cb292ce10bc821a75d).
- Archive SHA-256: `0440ff18f86197b84104f4442b94af82f650237ec6498e3db21403a591add06c`
- Revision: `c53cf113fdcf0b6d81b0e9cb292ce10bc821a75d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1086.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1086 and live-installed 0.576.0.
2. Continue a11y form labels.
