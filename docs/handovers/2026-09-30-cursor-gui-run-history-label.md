# 2026-09-30 — 0.305.0: Run history accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Turn Run history disclosure exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.305.0
- Branch and base: `feat/gui-run-history-label` on `main` (0.304.0)
- Implementation commit(s): da1dd04
- PR: #551

## Changes and relevant files

- Turn Run history `details` sets `aria-label="Run history"`.
- Package 0.305.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #551; live-installed on 192.168.1.20 (0.305.0 / da1dd045321aa9322bc13c8cc64406103bd36892).
- Archive SHA-256: `4e42051497709875c50b703130d0c50ed6d220d0a6684ddc2af39d26f5a33f2a`
- Revision: `da1dd045321aa9322bc13c8cc64406103bd36892`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.304.0 / revert of #551.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #551 and live-installed 0.305.0.
2. Label Review checks next.
