# 2026-09-30 — 0.421.0: History dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.421.0
- Implementation commit(s): 74f1e4e
- PR: #782

## Changes and relevant files

- See feature PR #782.
- Package 0.421.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #782; live-installed on 192.168.1.20 (0.421.0 / 74f1e4e15410ec62861e04fa26d07613f2fd1429).
- Archive SHA-256: `a52c54bb5507f90425d391a47172a02fbf15713ad6391e9613ab87dab843c4fb`
- Revision: `74f1e4e15410ec62861e04fa26d07613f2fd1429`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #782.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #782 and live-installed 0.421.0.
2. Continue a11y form labels.
