# 2026-09-30 — 0.473.0: Feedback content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Feedback content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.473.0
- Implementation commit(s): 9aba091
- PR: #882

## Changes and relevant files

- See feature PR #882.
- Package 0.473.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #882; live-installed on 192.168.1.20 (0.473.0 / 9aba091b77ceb0c61ea67449f7e600c9dd619577).
- Archive SHA-256: `cf6b8636e60a8fd3eccef3992bb8d9ce3c547da16c80bb6bb85b7b9604d563b7`
- Revision: `9aba091b77ceb0c61ea67449f7e600c9dd619577`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #882.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #882 and live-installed 0.473.0.
2. Continue a11y form labels.
