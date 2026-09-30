# 2026-09-30 — 0.300.0: Activity summary accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity summary exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.300.0
- Branch and base: `feat/gui-activity-summary-label` on `main` (0.299.0)
- Implementation commit(s): 319bad8
- PR: #541

## Changes and relevant files

- Activity `operation-summary` sets `aria-label="Activity summary"`.
- Package 0.300.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #541; live-installed on 192.168.1.20 (0.300.0 / 319bad80802587e16dc8626cc44ae5e73369f49b).
- Archive SHA-256: `7524c530b342015a36bfd60a0d1d7a819fc240ec82b5d551c9d2b8260056c476`
- Revision: `319bad80802587e16dc8626cc44ae5e73369f49b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.299.0 / revert of #541.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #541 and live-installed 0.300.0.
2. Label Activity service section next.
