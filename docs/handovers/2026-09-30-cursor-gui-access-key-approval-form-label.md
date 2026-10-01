# 2026-09-30 — 0.351.0: Confirm access key change form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Confirm access key change form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.351.0
- Implementation commit(s): 34b749f
- PR: #643

## Changes and relevant files

- See feature PR #643.
- Package 0.351.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #643; live-installed on 192.168.1.20 (0.351.0 / 34b749f70a7dcfd2a0be69aaa614c4442435d682).
- Archive SHA-256: `2c3c5ccfa1a174db54d2f7df7c9c58d8200cc75a2c0b6c130a3c652d9f91d003`
- Revision: `34b749f70a7dcfd2a0be69aaa614c4442435d682`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #643.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #643 and live-installed 0.351.0.
2. Continue a11y form labels.
