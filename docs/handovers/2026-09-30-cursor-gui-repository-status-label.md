# 2026-09-30 — 0.183.0: Repository status accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Repository import status live region must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.183.0
- Branch and base: `feat/gui-repository-status-label` on `main` (0.182.0)
- Implementation commit(s): d54f7c7
- PR: #307

## Changes and relevant files

- `#repository-status` aria-label "Repository status" (keeps aria-live polite).
- Package 0.183.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #307; live-installed on 192.168.1.20 (0.183.0 / d54f7c7).
- Archive SHA-256: `dfd73d3b6aeb6f1e0a4817e12321179c06e55ef1dea752242ea46830e43a51ab`
- Revision: `d54f7c7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.182.0 / revert of #307.

## Constraints and known issues

- Complements repository find/import form labels.

## Next steps

1. Done: merged #307 and live-installed 0.183.0.
2. Continue UX polish or admin slices as operator priority allows.
