# 2026-09-30 — 0.493.0: Backups settings focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Backups settings focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.493.0
- Implementation commit(s): a7c4aa4
- PR: #921

## Changes and relevant files

- See feature PR #921.
- Package 0.493.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #921; live-installed on 192.168.1.20 (0.493.0 / a7c4aa405f7d4348f0747d79e3d374c8e1a6677e).
- Archive SHA-256: `36564e0fd065ef7a12f131af1a5acc88493123bf5ecbcf03a938b641b2a66842`
- Revision: `a7c4aa405f7d4348f0747d79e3d374c8e1a6677e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #921.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #921 and live-installed 0.493.0.
2. Continue a11y form labels.
