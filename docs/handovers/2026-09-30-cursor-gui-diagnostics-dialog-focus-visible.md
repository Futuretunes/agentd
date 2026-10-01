# 2026-09-30 — 0.432.0: Diagnostics dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.432.0
- Implementation commit(s): 0f84afc
- PR: #803

## Changes and relevant files

- See feature PR #803.
- Package 0.432.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #803; live-installed on 192.168.1.20 (0.432.0 / 0f84afc5dea102f5cde060a0af990a5776c0949e).
- Archive SHA-256: `565d47aed06971dcf2db754000d2c824bafe39a567bb936d76281c7762fb81dd`
- Revision: `0f84afc5dea102f5cde060a0af990a5776c0949e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #803.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #803 and live-installed 0.432.0.
2. Continue a11y form labels.
