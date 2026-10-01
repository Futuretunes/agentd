# 2026-09-30 — 0.444.0: Detail panel focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Detail panel focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.444.0
- Implementation commit(s): 9e8ddff
- PR: #826

## Changes and relevant files

- See feature PR #826.
- Package 0.444.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #826; live-installed on 192.168.1.20 (0.444.0 / 9e8ddff24e35636b10cfead2a38b2a5cc3a31d62).
- Archive SHA-256: `d13f5b3da826e08c7f98e5d0dc45bb902bd5821dcf1efe3cba4827dd5872e38f`
- Revision: `9e8ddff24e35636b10cfead2a38b2a5cc3a31d62`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #826.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #826 and live-installed 0.444.0.
2. Continue a11y form labels.
