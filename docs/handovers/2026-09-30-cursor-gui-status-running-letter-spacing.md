# 2026-09-30 — 0.597.0: Active status letter-spacing (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Active status letter-spacing
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.597.0
- Implementation commit(s): e61157d
- PR: #1128

## Changes and relevant files

- See feature PR #1128.
- Package 0.597.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1128; live-installed on 192.168.1.20 (0.597.0 / e61157dd1a9a2ff2b24ba4c64b06ae3cac342b7c).
- Archive SHA-256: `9a859db8283b99a1b63df3301536bb096a8be6312ff144441f0896df0e571fd0`
- Revision: `e61157dd1a9a2ff2b24ba4c64b06ae3cac342b7c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1128.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1128 and live-installed 0.597.0.
2. Continue a11y form labels.
