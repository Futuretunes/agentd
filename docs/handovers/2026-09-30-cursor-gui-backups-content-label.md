# 2026-09-30 — 0.181.0: Managed backups panel accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Managed backups dialog content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.181.0
- Branch and base: `feat/gui-backups-content-label` on `main` (0.180.0)
- Implementation commit(s): 1b3756c
- PR: #303

## Changes and relevant files

- `#backups-content` aria-label "Managed backups" (keeps aria-live polite).
- Package 0.181.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #303; live-installed on 192.168.1.20 (0.181.0 / 1b3756c).
- Archive SHA-256: `7916c26940bb02c7cfde989dd74a4ea0332fd9d5b95d2807f0a126cff7184180`
- Revision: `1b3756c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.180.0 / revert of #303.

## Constraints and known issues

- Complements Managed backups dialog heading.

## Next steps

1. Done: merged #303 and live-installed 0.181.0.
2. Continue UX polish or admin slices as operator priority allows.
