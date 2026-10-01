# 2026-09-30 — 0.380.0: Agent message accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent message accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.380.0
- Implementation commit(s): cf5b6b7
- PR: #700

## Changes and relevant files

- See feature PR #700.
- Package 0.380.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #700; live-installed on 192.168.1.20 (0.380.0 / cf5b6b7e05f926385a9e1dc9a21643cd0218debd).
- Archive SHA-256: `53ec3b3aa0806a345713749ca83d3f8be1331d371cfc2abdf0ca13556a36b7d7`
- Revision: `cf5b6b7e05f926385a9e1dc9a21643cd0218debd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #700.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #700 and live-installed 0.380.0.
2. Continue a11y form labels.
