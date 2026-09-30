# 2026-09-30 — 0.213.0: Picker panel safe-area insets (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Agent picker panel must clear horizontal and vertical safe-area insets
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.213.0
- Branch and base: `feat/gui-picker-panel-safe-area` on `main` (0.212.0)
- Implementation commit(s): b7189e2
- PR: #367

## Changes and relevant files

- `.picker-panel` width subtracts left/right safe-area insets.
- Phone `.picker-panel` max-height subtracts top/bottom safe-area insets.
- Package 0.213.0; CSS assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #367; live-installed on 192.168.1.20 (0.213.0 / b7189e2).
- Archive SHA-256: `4634fd5c30a5217e2d06a93a9402c14a587951edae0602c721a232984c63f6d9`
- Revision: `b7189e2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.212.0 / revert of #367.

## Constraints and known issues

None beyond ordinary CSS safe-area handling.

## Next steps

1. Done: merged #367 and live-installed 0.213.0.
2. Bound phone drawer width to left safe-area next.
