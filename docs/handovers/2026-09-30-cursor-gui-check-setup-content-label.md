# 2026-09-30 — 0.176.0: Check setup content accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Set up checks panel must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.176.0
- Branch and base: `feat/gui-check-setup-content-label` on `main` (0.175.0)
- Implementation commit(s): 07e4d3d
- PR: #293

## Changes and relevant files

- `#check-setup-content` aria-label "Check setup" (keeps aria-live polite).
- Package 0.176.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #293; live-installed on 192.168.1.20 (0.176.0 / 07e4d3d).
- Archive SHA-256: `6d49eb6b107622996a33f98aeb66d382da41ae5640ee2c7bbbaf2263bb13d417`
- Revision: `07e4d3d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.175.0 / revert of #293.

## Constraints and known issues

- Complements check-setup dialog heading.

## Next steps

1. Done: merged #293 and live-installed 0.176.0.
2. Continue UX polish or admin slices as operator priority allows.
