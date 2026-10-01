# 2026-09-30 — 0.477.0: CLI content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: CLI content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.477.0
- Implementation commit(s): 27b6e42
- PR: #890

## Changes and relevant files

- See feature PR #890.
- Package 0.477.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #890; live-installed on 192.168.1.20 (0.477.0 / 27b6e4250c65a75a41fb3d4be08f93317abf71f2).
- Archive SHA-256: `0784f32e93ae6bce9c330f903946b3326ed5946fa54c649289ee282539bb4fec`
- Revision: `27b6e4250c65a75a41fb3d4be08f93317abf71f2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #890.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #890 and live-installed 0.477.0.
2. Continue a11y form labels.
