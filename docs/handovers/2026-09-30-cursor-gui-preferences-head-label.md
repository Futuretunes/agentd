# 2026-09-30 — 0.265.0: Settings dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Settings dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.265.0
- Branch and base: `feat/gui-preferences-head-label` on `main` (0.264.0)
- Implementation commit(s): b53f843
- PR: #471

## Changes and relevant files

- Preferences dialog `.review-head` sets `role="group"` and `aria-label="Settings heading"`.
- Package 0.265.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #471; live-installed on 192.168.1.20 (0.265.0 / b53f843c1b7112f0b36a96d9210179bf096569db).
- Archive SHA-256: `b91c48df14222c5a038c878fe987a4c8fbdfee9ab9f06459bbc21d2fd5987428`
- Revision: `b53f843c1b7112f0b36a96d9210179bf096569db`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.264.0 / revert of #471.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #471 and live-installed 0.265.0.
2. Label activity dialog heading next.
