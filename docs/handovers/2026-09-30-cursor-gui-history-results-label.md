# 2026-09-30 — 0.159.0: History results accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Find your work results region must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.159.0
- Branch and base: `feat/gui-history-results-label` on `main` (0.158.0)
- Implementation commit(s): 1ccb81e
- PR: #259

## Changes and relevant files

- `#history-results` aria-label "Search results".
- Package 0.159.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #259; live-installed on 192.168.1.20 (0.159.0 / 1ccb81e).
- Archive SHA-256: `f7784d7eb14952567e47aee9e7f5f009385cb7ce5356d427abcedbba161631a0`
- Revision: `1ccb81e4f43786078d66e3c4eadc31f05c981fa6`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.158.0 / revert of #259.

## Constraints and known issues

- Complements history pagination and archived-projects labels.

## Next steps

1. Done: merged #259 and live-installed 0.159.0.
2. Continue UX polish or admin slices as operator priority allows.
