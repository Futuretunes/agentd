# 2026-09-30 — 0.376.0: Conversation turn accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation turn accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.376.0
- Implementation commit(s): 282f253
- PR: #692

## Changes and relevant files

- See feature PR #692.
- Package 0.376.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #692; live-installed on 192.168.1.20 (0.376.0 / 282f253242e1cd38a31d1686b6f710a2b2a93621).
- Archive SHA-256: `f0c4f14e25c18d7172abb8dd0b6f9f54ed8f66d4fc1fa82e90926840d56f06a6`
- Revision: `282f253242e1cd38a31d1686b6f710a2b2a93621`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #692.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #692 and live-installed 0.376.0.
2. Continue a11y form labels.
