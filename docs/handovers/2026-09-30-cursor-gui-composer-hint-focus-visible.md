# 2026-09-30 — 0.505.0: Composer hint focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer hint focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.505.0
- Implementation commit(s): 7a15cc4
- PR: #945

## Changes and relevant files

- See feature PR #945.
- Package 0.505.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #945; live-installed on 192.168.1.20 (0.505.0 / 7a15cc4400b0b1c88ea94115328c22b2385b048e).
- Archive SHA-256: `2a9a47f7db0e3d97ebfa5c7e12a21d4db2cc967119a8b9686397794e15a7fc3a`
- Revision: `7a15cc4400b0b1c88ea94115328c22b2385b048e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #945.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #945 and live-installed 0.505.0.
2. Continue a11y form labels.
