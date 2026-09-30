# 2026-09-30 — 0.117.0: Phone drawer and sheet motion (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Phone navigation drawer and dialog sheets should open with a short motion that respects reduced-motion
- Status: implemented
- Release: 0.117.0
- Branch and base: `feat/gui-drawer-sheet-motion` on `main` (0.116.0)
- Implementation commit(s): 131013c
- PR: #175

## Changes and relevant files

- Phone `#sidebar` slides in/out over 240ms with delayed `visibility` so close still animates.
- Phone dialogs use `agentd-sheet-up`; existing `prefers-reduced-motion` rule disables both.
- Drawer gains `safe-area-inset-top` padding.
- Package 0.117.0; CSS assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Motion is CSS-only; no JS animation timeline.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
