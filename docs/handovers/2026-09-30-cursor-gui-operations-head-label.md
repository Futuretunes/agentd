# 2026-09-30 — 0.266.0: Activity dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.266.0
- Branch and base: `feat/gui-operations-head-label` on `main` (0.265.0)
- Implementation commit(s): 59b21a0
- PR: #473

## Changes and relevant files

- Operations dialog `.review-head` sets `role="group"` and `aria-label="Activity heading"`.
- Package 0.266.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #473; live-installed on 192.168.1.20 (0.266.0 / 59b21a0a8c73a7c3b2dc8b11dabddaf90af3ec97).
- Archive SHA-256: `4059cb55b366497beeb2fa40a4942e8c83bdf3aa1efd229684827382fc5fdb9f`
- Revision: `59b21a0a8c73a7c3b2dc8b11dabddaf90af3ec97`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.265.0 / revert of #473.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #473 and live-installed 0.266.0.
2. Label project settings dialog heading next.
