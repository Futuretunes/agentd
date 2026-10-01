# 2026-09-30 — 0.378.0: Run timeline accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Run timeline accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.378.0
- Implementation commit(s): 75bb473
- PR: #696

## Changes and relevant files

- See feature PR #696.
- Package 0.378.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #696; live-installed on 192.168.1.20 (0.378.0 / 75bb473a58d81e2918fe259034812e3e67c2e4a1).
- Archive SHA-256: `1d9b022e5d86da33fc33bd2073ea2921566f7a605d6a36c5b02be87f34b8c9af`
- Revision: `75bb473a58d81e2918fe259034812e3e67c2e4a1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #696.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #696 and live-installed 0.378.0.
2. Continue a11y form labels.
