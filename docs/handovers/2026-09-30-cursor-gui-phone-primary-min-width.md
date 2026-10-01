# 2026-09-30 — 0.585.0: Phone primary min-width (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone primary min-width
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.585.0
- Implementation commit(s): d0cf12e
- PR: #1104

## Changes and relevant files

- See feature PR #1104.
- Package 0.585.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1104; live-installed on 192.168.1.20 (0.585.0 / d0cf12e8eeec204616a5204af05aa938c22c3672).
- Archive SHA-256: `0c1fb491cced564dbb9d45ec1b60ff6f7c7cf88c6f0837e4107d92c243a566fb`
- Revision: `d0cf12e8eeec204616a5204af05aa938c22c3672`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1104.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1104 and live-installed 0.585.0.
2. Continue a11y form labels.
