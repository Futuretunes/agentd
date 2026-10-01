# 2026-09-30 — 0.433.0: Access key dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Access key dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.433.0
- Implementation commit(s): 39d34f2
- PR: #805

## Changes and relevant files

- See feature PR #805.
- Package 0.433.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #805; live-installed on 192.168.1.20 (0.433.0 / 39d34f2011f7bca428d4a8ed6d6554eb3c7b88c5).
- Archive SHA-256: `89adb0a7178a0bc53a774e153f3f34016d1778f8c68e2c460933e039a8d735bd`
- Revision: `39d34f2011f7bca428d4a8ed6d6554eb3c7b88c5`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #805.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #805 and live-installed 0.433.0.
2. Continue a11y form labels.
