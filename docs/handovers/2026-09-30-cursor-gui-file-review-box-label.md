# 2026-09-30 — 0.397.0: File review box accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: File review box accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.397.0
- Implementation commit(s): 700cdff
- PR: #734

## Changes and relevant files

- See feature PR #734.
- Package 0.397.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #734; live-installed on 192.168.1.20 (0.397.0 / 700cdff462f7374c795bdaa5cf73624022e87e04).
- Archive SHA-256: `1f061c93c96d2b36150e322237e6956661b3477f42cca45206d50e9e59784b52`
- Revision: `700cdff462f7374c795bdaa5cf73624022e87e04`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #734.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #734 and live-installed 0.397.0.
2. Continue a11y form labels.
