# 2026-09-30 — 0.356.0: Backup restore approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Backup restore approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.356.0
- Implementation commit(s): 70aab14
- PR: #653

## Changes and relevant files

- See feature PR #653.
- Package 0.356.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #653; live-installed on 192.168.1.20 (0.356.0 / 70aab14a34fd47c7bb8ee22c23852142a5ba4138).
- Archive SHA-256: `3ebb9fec35a6067e1c2492abab4f04c70b36b2d2fa7a374385cf3eb189716122`
- Revision: `70aab14a34fd47c7bb8ee22c23852142a5ba4138`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #653.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #653 and live-installed 0.356.0.
2. Continue a11y form labels.
