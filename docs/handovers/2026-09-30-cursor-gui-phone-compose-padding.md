# 2026-09-30 — 0.596.0: Phone composer padding (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone composer padding
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.596.0
- Implementation commit(s): c0ff42e
- PR: #1126

## Changes and relevant files

- See feature PR #1126.
- Package 0.596.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1126; live-installed on 192.168.1.20 (0.596.0 / c0ff42e855e280c47041715033f579b2fc50ec2e).
- Archive SHA-256: `860677b97df7811c07d49500eb334046bc3e01e9d89d1644680aaca21a0e9258`
- Revision: `c0ff42e855e280c47041715033f579b2fc50ec2e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1126.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1126 and live-installed 0.596.0.
2. Continue a11y form labels.
