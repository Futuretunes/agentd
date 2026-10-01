# 2026-09-30 — 0.516.0: New conversation focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: New conversation focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.516.0
- Implementation commit(s): 7db48e9
- PR: #967

## Changes and relevant files

- See feature PR #967.
- Package 0.516.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #967; live-installed on 192.168.1.20 (0.516.0 / 7db48e9c7ecd41ee2d067b033c20733c619d6407).
- Archive SHA-256: `e52452edfe6915c270baf5eefcfb701e25afac95a51de96bb59e4d43bb4625d5`
- Revision: `7db48e9c7ecd41ee2d067b033c20733c619d6407`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #967.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #967 and live-installed 0.516.0.
2. Continue a11y form labels.
