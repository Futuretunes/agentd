# 2026-09-30 — 0.214.0: Phone drawer width safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone drawer width must subtract left safe-area inset
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.214.0
- Branch and base: `feat/gui-drawer-width-safe-area` on `main` (0.213.0)
- Implementation commit(s): a02d30e
- PR: #369

## Changes and relevant files

- Phone `#sidebar` width uses `min(310px, calc(85vw - env(safe-area-inset-left)))`.
- Package 0.214.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #369; live-installed on 192.168.1.20 (0.214.0 / a02d30e).
- Archive SHA-256: `0ad94bd190d8acc4f2ecd34b180ae5b3e7a83c9e6c0808050592e4879ab5ac07`
- Revision: `a02d30e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.213.0 / revert of #369.

## Constraints and known issues

- Complements drawer left/right padding safe-area from 0.188/0.195.

## Next steps

1. Done: merged #369 and live-installed 0.214.0.
2. Make Appearance theme label visible next.
