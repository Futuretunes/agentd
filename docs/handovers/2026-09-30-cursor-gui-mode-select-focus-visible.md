# 2026-09-30 — 0.509.0: Mode select focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Mode select focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.509.0
- Implementation commit(s): 1e5a68e
- PR: #953

## Changes and relevant files

- See feature PR #953.
- Package 0.509.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #953; live-installed on 192.168.1.20 (0.509.0 / 1e5a68e8487de81325be9133b2bf3734e7795e31).
- Archive SHA-256: `489dda1b236138ae6da1a597f97b0b13ceb537ab88cadc900515630f4adf7188`
- Revision: `1e5a68e8487de81325be9133b2bf3734e7795e31`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #953.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #953 and live-installed 0.509.0.
2. Continue a11y form labels.
