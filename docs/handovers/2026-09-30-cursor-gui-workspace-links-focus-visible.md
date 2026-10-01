# 2026-09-30 — 0.457.0: Workspace links focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Workspace links focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.457.0
- Implementation commit(s): 931878a
- PR: #852

## Changes and relevant files

- See feature PR #852.
- Package 0.457.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #852; live-installed on 192.168.1.20 (0.457.0 / 931878af52b82cb1a65d29edb1a0384ec670da8a).
- Archive SHA-256: `5cff6a1cccf94dfcf3b7d12a211bf9add1e5e99ce3a95dbfd35d1eeb4054bb5c`
- Revision: `931878af52b82cb1a65d29edb1a0384ec670da8a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #852.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #852 and live-installed 0.457.0.
2. Continue a11y form labels.
