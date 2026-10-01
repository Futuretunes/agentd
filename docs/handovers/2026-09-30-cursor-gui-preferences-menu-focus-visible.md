# 2026-09-30 — 0.546.0: Settings menu focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Settings menu focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.546.0
- Implementation commit(s): 66056a5
- PR: #1026

## Changes and relevant files

- See feature PR #1026.
- Package 0.546.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1026; live-installed on 192.168.1.20 (0.546.0 / 66056a50280f5d9756c8c8c8f0796aa4f3828c6b).
- Archive SHA-256: `cf0975debb2a01df5817b44338af350ced385f1530927de7a398050cf431a120`
- Revision: `66056a50280f5d9756c8c8c8f0796aa4f3828c6b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1026.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1026 and live-installed 0.546.0.
2. Continue a11y form labels.
