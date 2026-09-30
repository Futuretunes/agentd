# 2026-09-30 — 0.173.0: Settings agent accounts accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Settings agent accounts live region must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.173.0
- Branch and base: `feat/gui-settings-accounts-label` on `main` (0.172.0)
- Implementation commit(s): 8aaf722
- PR: #287

## Changes and relevant files

- `#settings-accounts` aria-label "Agent accounts" (keeps aria-live polite).
- Package 0.173.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #287; live-installed on 192.168.1.20 (0.173.0 / 8aaf722).
- Archive SHA-256: `b93884c0efdd157f353284a64c5b2b7d43134d42df218dfd33a5908099816682`
- Revision: `8aaf722b0a87d19b65176bd214a0dff3e527313e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.172.0 / revert of #287.

## Constraints and known issues

- Account cards remain dynamically rendered inside the labeled region.

## Next steps

1. Done: merged #287 and live-installed 0.173.0.
2. Continue UX polish or admin slices as operator priority allows.
