# 2026-09-30 — 0.160.0: History search form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Find your work search form must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.160.0
- Branch and base: `feat/gui-history-form-label` on `main` (0.159.0)
- Implementation commit(s): c7a66e2
- PR: #261

## Changes and relevant files

- `#history-form` aria-label "Search history".
- Package 0.160.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #261; live-installed on 192.168.1.20 (0.160.0 / c7a66e2).
- Archive SHA-256: `c2205bc4fb3e2f0c3220e69d0c76817e66e5601075f4ec3b3e7e93e97ede10d3`
- Revision: `c7a66e2bef069f8da1d916d54911a92681f4dcda`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.159.0 / revert of #261.

## Constraints and known issues

- Complements history results and pagination labels.

## Next steps

1. Done: merged #261 and live-installed 0.160.0.
2. Continue UX polish or admin slices as operator priority allows.
