# 2026-09-30 — 0.412.0: Drawer open focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Drawer open focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.412.0
- Implementation commit(s): f934bb9
- PR: #764

## Changes and relevant files

- See feature PR #764.
- Package 0.412.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #764; live-installed on 192.168.1.20 (0.412.0 / f934bb942fed8ab4edac997105e9fbd551039ae0).
- Archive SHA-256: `73b506045f46cbe69fc2c226f4ecccb2ceb70f9d97001b6591af29b6dce42bfb`
- Revision: `f934bb942fed8ab4edac997105e9fbd551039ae0`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #764.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #764 and live-installed 0.412.0.
2. Continue a11y form labels.
