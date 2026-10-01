# 2026-09-30 — 0.475.0: Configuration content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.475.0
- Implementation commit(s): 40d9277
- PR: #886

## Changes and relevant files

- See feature PR #886.
- Package 0.475.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #886; live-installed on 192.168.1.20 (0.475.0 / 40d9277e4f281483c691d34693f10e3ef0a89c19).
- Archive SHA-256: `b2b054ac193bd98e59227b01e63f6a9514594cd19d29199cdf5c9ccecc50a088`
- Revision: `40d9277e4f281483c691d34693f10e3ef0a89c19`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #886.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #886 and live-installed 0.475.0.
2. Continue a11y form labels.
