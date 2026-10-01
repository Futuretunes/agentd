# 2026-09-30 — 0.504.0: Policy hint focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Policy hint focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.504.0
- Implementation commit(s): 0a68b7e
- PR: #943

## Changes and relevant files

- See feature PR #943.
- Package 0.504.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #943; live-installed on 192.168.1.20 (0.504.0 / 0a68b7ef37093ec32b147ffbd4d8022ba102caf8).
- Archive SHA-256: `c8389e288f187897a048641feff7235322ef36c2f3de2adc58cdd843b6158ddb`
- Revision: `0a68b7ef37093ec32b147ffbd4d8022ba102caf8`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #943.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #943 and live-installed 0.504.0.
2. Continue a11y form labels.
