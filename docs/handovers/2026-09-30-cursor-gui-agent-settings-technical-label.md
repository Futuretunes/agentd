# 2026-09-30 — 0.317.0: Agent settings technical disclosure accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent settings technical disclosure exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.317.0
- Branch and base: `feat/gui-agent-settings-technical-label` on `main` (0.316.0)
- Implementation commit(s): 5e5807c
- PR: #575

## Changes and relevant files

- Agent settings technical `details` sets `aria-label="How defaults and permissions work"`.
- Package 0.317.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #575; live-installed on 192.168.1.20 (0.317.0 / 5e5807c1c30ad8ef74de26495bd25c22c1e3b870).
- Archive SHA-256: `85e7bd4fefb7cd5e486ad679eb6e5bd29e815819c4b2c4014016364f6cce9424`
- Revision: `5e5807c1c30ad8ef74de26495bd25c22c1e3b870`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.316.0 / revert of #575.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #575 and live-installed 0.317.0.
2. Label Diagnostics Services next.
