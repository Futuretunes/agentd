# 2026-09-30 — 0.297.0: Turn history navigation accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation turn history navigation exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.297.0
- Branch and base: `feat/gui-turn-history-nav-label` on `main` (0.296.0)
- Implementation commit(s): 52021b1
- PR: #535

## Changes and relevant files

- Turn history-navigation sets `role="group"` and `aria-label="Turn history navigation"`.
- Package 0.297.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #535; live-installed on 192.168.1.20 (0.297.0 / 52021b164d2f0cfaee20de699153328bfe1e96d6).
- Archive SHA-256: `b7ce6793603470a2d4ae3a9de0ba8f08f8306efa8b4c473d4c20db6d9bc3e482`
- Revision: `52021b164d2f0cfaee20de699153328bfe1e96d6`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.296.0 / revert of #535.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #535 and live-installed 0.297.0.
2. Label history result actions next.
