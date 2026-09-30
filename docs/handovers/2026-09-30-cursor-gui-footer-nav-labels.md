# 2026-09-30 — 0.150.0: Sidebar foot nav accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Search & history, Activity, and Settings must expose stable accessible names
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.150.0
- Branch and base: `feat/gui-footer-nav-labels` on `main` (0.149.0)
- Implementation commit(s): 7c2bec1
- PR: #241

## Changes and relevant files

- `#history-menu` aria-label "Search and history"; `#operations-menu` "Activity"; `#preferences-menu` "Settings".
- Package 0.150.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #241; live-installed on 192.168.1.20 (0.150.0 / 7c2bec1).
- Archive SHA-256: `7ea5d1ad368b53834bf48f30a1235a911c3560d56f5cca0c07837beba7e5fd64`
- Revision: `7c2bec15a6be63c0c3486c39cd9763e38f0bb836`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.149.0 / revert of #241.

## Constraints and known issues

- Visible "Search & history" keeps the ampersand; the accessible name uses "and".

## Next steps

1. Done: merged #241 and live-installed 0.150.0.
2. Continue UX polish or admin slices as operator priority allows.
