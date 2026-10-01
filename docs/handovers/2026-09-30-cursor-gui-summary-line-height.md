# 2026-09-30 — 0.579.0: Summary line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Summary line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.579.0
- Implementation commit(s): c01017e
- PR: #1092

## Changes and relevant files

- See feature PR #1092.
- Package 0.579.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1092; live-installed on 192.168.1.20 (0.579.0 / c01017efa7e855bc30cebc36c791c524d95a0ed7).
- Archive SHA-256: `03fa761276c62710d47362c863705168261cf407f45fe417b28d2dde95e933ad`
- Revision: `c01017efa7e855bc30cebc36c791c524d95a0ed7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1092.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1092 and live-installed 0.579.0.
2. Continue a11y form labels.
