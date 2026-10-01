# 2026-09-30 — 0.437.0: New project dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: New project dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.437.0
- Implementation commit(s): 7278ec4
- PR: #813

## Changes and relevant files

- See feature PR #813.
- Package 0.437.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #813; live-installed on 192.168.1.20 (0.437.0 / 7278ec47eb2b92254a8b039d17cab23f3d0c9491).
- Archive SHA-256: `ce1cb33ee789debdbf1c1b6023e1b44e5865f3bb05c9623562f8d27d52ab528d`
- Revision: `7278ec47eb2b92254a8b039d17cab23f3d0c9491`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #813.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #813 and live-installed 0.437.0.
2. Continue a11y form labels.
