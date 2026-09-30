# 2026-09-30 — 0.117.0: Phone drawer and sheet motion (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Phone navigation drawer and dialog sheets should open with a short motion that respects reduced-motion
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.117.0
- Branch and base: `feat/gui-drawer-sheet-motion` on `main` (0.116.0)
- Implementation commit(s): 00d9006
- PR: #175

## Changes and relevant files

- Phone `#sidebar` slides in/out over 240ms with delayed `visibility` so close still animates.
- Phone dialogs use `agentd-sheet-up`; existing `prefers-reduced-motion` rule disables both.
- Drawer gains `safe-area-inset-top` padding.
- Package 0.117.0; CSS assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #175; live-installed on 192.168.1.20 (0.117.0 / 2cd9a5e).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.116.0 / revert of #175.

## Constraints and known issues

- Motion is CSS-only; no JS animation timeline.

## Next steps

1. Done: merged #175 and live-installed 0.117.0.
2. Continue UX polish or admin slices as operator priority allows.
