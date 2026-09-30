# 2026-09-30 — 0.289.0: Agent settings dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent settings dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.289.0
- Branch and base: `feat/gui-agent-settings-head-label` on `main` (0.288.0)
- Implementation commit(s): adfdf8a
- PR: #519

## Changes and relevant files

- Dynamically created Agent settings `.review-head` sets `role="group"` and `aria-label="Agent settings heading"`.
- Package 0.289.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #519; live-installed on 192.168.1.20 (0.289.0 / adfdf8a7280c1363b300d51407286a03f262cbb7).
- Archive SHA-256: `c5cabdef612e0d0db76b118351da625ad4f2358da018e06313941177a0684db1`
- Revision: `adfdf8a7280c1363b300d51407286a03f262cbb7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.288.0 / revert of #519.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #519 and live-installed 0.289.0.
2. Label account dialog content next.
