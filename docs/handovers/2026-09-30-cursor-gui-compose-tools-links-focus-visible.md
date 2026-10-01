# 2026-09-30 — 0.464.0: Composer tool links focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer tool links focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.464.0
- Implementation commit(s): bab2cdb
- PR: #866

## Changes and relevant files

- See feature PR #866.
- Package 0.464.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #866; live-installed on 192.168.1.20 (0.464.0 / bab2cdb33f1155b77307cb3844c3f549f01e49e2).
- Archive SHA-256: `04a18f60947d9bd35ebf05eaacb5aaa44aa7ec76a9962ac23dae9b8316df345a`
- Revision: `bab2cdb33f1155b77307cb3844c3f549f01e49e2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #866.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #866 and live-installed 0.464.0.
2. Continue a11y form labels.
