# 2026-09-30 — 0.394.0: Publication description accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication description accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.394.0
- Implementation commit(s): 10bd97d
- PR: #728

## Changes and relevant files

- See feature PR #728.
- Package 0.394.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #728; live-installed on 192.168.1.20 (0.394.0 / 10bd97d967c7dfcb37154c30c994b9503efb8918).
- Archive SHA-256: `6ebcdc769075ec29476daabbeeabe5f0dcf236b656b498bd6c7b368278756205`
- Revision: `10bd97d967c7dfcb37154c30c994b9503efb8918`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #728.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #728 and live-installed 0.394.0.
2. Continue a11y form labels.
