# 2026-09-30 — 0.253.0: Conversation identity group accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation identity group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.253.0
- Branch and base: `feat/gui-conversation-heading-label` on `main` (0.252.0)
- Implementation commit(s): e569fb3
- PR: #447

## Changes and relevant files

- `.conversation-heading` sets `role="group"` and `aria-label="Conversation identity"`.
- Package 0.253.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #447; live-installed on 192.168.1.20 (0.253.0 / 44f883eaa0d2e3d3b5ebab5196cb08de5f09ea24).
- Archive SHA-256: `269e9f5e8a2240ab314630d349c1dcb988f20d80c24a008ecbf3b84e7053e737`
- Revision: `44f883eaa0d2e3d3b5ebab5196cb08de5f09ea24`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.252.0 / revert of #447.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #447 and live-installed 0.253.0.
2. Label composer tools group next.
