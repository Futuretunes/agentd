# 2026-09-30 — 0.549.0: Phone menu panel touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone menu panel touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.549.0
- Implementation commit(s): 04ce666
- PR: #1032

## Changes and relevant files

- See feature PR #1032.
- Package 0.549.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1032; live-installed on 192.168.1.20 (0.549.0 / 04ce666b2f5e35562bdbf78451cfb1136afcecfe).
- Archive SHA-256: `bc72aba68654c6dd548ead53a7265e5f4d25c8524b2f8eb4703f2829df6d51a7`
- Revision: `04ce666b2f5e35562bdbf78451cfb1136afcecfe`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1032.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1032 and live-installed 0.549.0.
2. Continue a11y form labels.
