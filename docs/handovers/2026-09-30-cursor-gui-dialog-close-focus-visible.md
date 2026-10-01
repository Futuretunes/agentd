# 2026-09-30 — 0.416.0: Dialog button focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog button focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.416.0
- Implementation commit(s): 0e16bae
- PR: #772

## Changes and relevant files

- See feature PR #772.
- Package 0.416.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #772; live-installed on 192.168.1.20 (0.416.0 / 0e16bae47f835a33b0b9dd6eb04af2dfdff76987).
- Archive SHA-256: `648c57da4db529ea4f8e4882f3f40498f1ec110deae865b8a6ce7251a9a40dbb`
- Revision: `0e16bae47f835a33b0b9dd6eb04af2dfdff76987`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #772.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #772 and live-installed 0.416.0.
2. Continue a11y form labels.
