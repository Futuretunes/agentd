# 2026-09-30 — 0.358.0: Complete account sign-in form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Complete account sign-in form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.358.0
- Implementation commit(s): 37d4c9d
- PR: #657

## Changes and relevant files

- See feature PR #657.
- Package 0.358.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #657; live-installed on 192.168.1.20 (0.358.0 / 37d4c9ddba62b89d4bb02d838a90a56ea078413c).
- Archive SHA-256: `b65430cfd6897a6256338d1f26af766ab4e2f521f6d7f201ee99b0c4bee774fa`
- Revision: `37d4c9ddba62b89d4bb02d838a90a56ea078413c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #657.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #657 and live-installed 0.358.0.
2. Continue a11y form labels.
