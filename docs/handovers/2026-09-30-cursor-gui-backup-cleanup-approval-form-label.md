# 2026-09-30 — 0.347.0: Backup cleanup approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Backup cleanup approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.347.0
- Implementation commit(s): dc96c2f
- PR: #635

## Changes and relevant files

- See feature PR #635.
- Package 0.347.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #635; live-installed on 192.168.1.20 (0.347.0 / dc96c2fbf337fddeea9a7003b96999798314a963).
- Archive SHA-256: `3611cfa52e7053028b80a2933913cd69412591297088ce69b72c8a2a14a182d6`
- Revision: `dc96c2fbf337fddeea9a7003b96999798314a963`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #635.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #635 and live-installed 0.347.0.
2. Continue a11y form labels.
