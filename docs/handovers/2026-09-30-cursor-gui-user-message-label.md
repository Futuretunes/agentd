# 2026-09-30 — 0.379.0: User message accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: User message accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.379.0
- Implementation commit(s): 11e154c
- PR: #698

## Changes and relevant files

- See feature PR #698.
- Package 0.379.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #698; live-installed on 192.168.1.20 (0.379.0 / 11e154ccf76beb8b9334a67adf1afc298043b25c).
- Archive SHA-256: `8a93d0787af5c2835c77bba5a5fe7ed5ffacf61d3aa35798ba34aa0b1ac9fecf`
- Revision: `11e154ccf76beb8b9334a67adf1afc298043b25c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #698.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #698 and live-installed 0.379.0.
2. Continue a11y form labels.
