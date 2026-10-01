# 2026-09-30 — 0.346.0: Save notification settings form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Save notification settings form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.346.0
- Implementation commit(s): f2fa4a5
- PR: #633

## Changes and relevant files

- See feature PR #633.
- Package 0.346.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #633; live-installed on 192.168.1.20 (0.346.0 / f2fa4a50e3de8314c758bfe91bab7dc86516e874).
- Archive SHA-256: `0e684136018385b1bf5c85b874f475e957853c08da99254228d7828d486e4387`
- Revision: `f2fa4a50e3de8314c758bfe91bab7dc86516e874`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #633.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #633 and live-installed 0.346.0.
2. Continue a11y form labels.
