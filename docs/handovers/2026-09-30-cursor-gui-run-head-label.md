# 2026-09-30 — 0.272.0: Run activity dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Run activity dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.272.0
- Branch and base: `feat/gui-run-head-label` on `main` (0.271.0)
- Implementation commit(s): 8839f00
- PR: #485

## Changes and relevant files

- Run dialog `.review-head` sets `role="group"` and `aria-label="Run activity heading"`.
- Package 0.272.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #485; live-installed on 192.168.1.20 (0.272.0 / 8839f00d352076e20c81255cf4cfd8573fc0e1d3).
- Archive SHA-256: `785e522a3766f05c702fac924353197eab304555a3cb760e2115536b4c7c0aac`
- Revision: `8839f00d352076e20c81255cf4cfd8573fc0e1d3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.271.0 / revert of #485.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #485 and live-installed 0.272.0.
2. Label check setup dialog heading next.
