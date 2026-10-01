# 2026-09-30 — 0.402.0: Code block accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Code block accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.402.0
- Implementation commit(s): e46db01
- PR: #744

## Changes and relevant files

- See feature PR #744.
- Package 0.402.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #744; live-installed on 192.168.1.20 (0.402.0 / e46db01fafc67e9b56ccb8447787b4749be4dc5d).
- Archive SHA-256: `19e8b85e7c790c7e20f16bd1dbd9af1f6298110790127fbf928210a0a7be8dd1`
- Revision: `e46db01fafc67e9b56ccb8447787b4749be4dc5d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #744.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #744 and live-installed 0.402.0.
2. Continue a11y form labels.
