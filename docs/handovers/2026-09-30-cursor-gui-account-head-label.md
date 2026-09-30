# 2026-09-30 — 0.288.0: Account dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Account dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.288.0
- Branch and base: `feat/gui-account-head-label` on `main` (0.287.0)
- Implementation commit(s): 03fff92
- PR: #517

## Changes and relevant files

- Dynamically created account dialog `.review-head` sets `role="group"` and `aria-label="Account heading"`.
- Package 0.288.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #517; live-installed on 192.168.1.20 (0.288.0 / 03fff92d9b930e322eb2c4acc497de9e31d76ea3).
- Archive SHA-256: `40ee6473ef67036edfbc6c3ea63d252a3e5c8f1b5d14f1292dce2de2427d53f6`
- Revision: `03fff92d9b930e322eb2c4acc497de9e31d76ea3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.287.0 / revert of #517.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #517 and live-installed 0.288.0.
2. Label Agent settings dialog heading next.
