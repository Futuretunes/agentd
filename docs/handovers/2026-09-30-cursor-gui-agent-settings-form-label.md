# 2026-09-30 — 0.291.0: Agent settings form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent settings form exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.291.0
- Branch and base: `feat/gui-agent-settings-form-label` on `main` (0.290.0)
- Implementation commit(s): ceab7ea
- PR: #523

## Changes and relevant files

- Dynamically created Agent settings form sets `aria-label="Agent settings form"`.
- Package 0.291.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #523; live-installed on 192.168.1.20 (0.291.0 / ceab7ea5ed910f7b7ffe33648c9731b84c5bf40c).
- Archive SHA-256: `149785b0e0d7d4a63e8e3b449567a01117c9641aca2c8d60af87a49dd3495cba`
- Revision: `ceab7ea5ed910f7b7ffe33648c9731b84c5bf40c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.290.0 / revert of #523.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #523 and live-installed 0.291.0.
2. Label Agent settings close control next.
