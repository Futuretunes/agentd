# 2026-09-30 — 0.491.0: Diagnostics settings focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics settings focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.491.0
- Implementation commit(s): a5f594c
- PR: #917

## Changes and relevant files

- See feature PR #917.
- Package 0.491.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #917; live-installed on 192.168.1.20 (0.491.0 / a5f594cc26104e0d0032414e8cb39c06875eefd9).
- Archive SHA-256: `0b3edeb8f6bab0dc32f3d31078b9e9c6b1d3a425e782d0e014d75d596553412e`
- Revision: `a5f594cc26104e0d0032414e8cb39c06875eefd9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #917.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #917 and live-installed 0.491.0.
2. Continue a11y form labels.
