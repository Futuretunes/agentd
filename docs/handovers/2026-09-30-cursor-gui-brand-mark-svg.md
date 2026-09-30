# 2026-09-30 — 0.98.0: SVG brand mark (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Replace the text “◈” logo glyph with a real SVG mark on brand surfaces
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.98.0
- Branch and base: `feat/gui-brand-mark-svg` on `main` (0.97.0)
- Implementation commit(s): 7ffd556
- PR: #137

## Changes and relevant files

- Login and sidebar brand markup use an inline SVG diamond; welcome empty state uses `brandMarkElement`.
- `brandMarkElement` in `public/ui.js`; CSS for `.brand-mark`.
- Package 0.98.0; coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #137; live-installed on 192.168.1.20 (0.98.0 / 3140b1861531).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.97.0 / revert of #137.

## Constraints and known issues

- Per-turn adapter prefixes (Cursor/Claude/Codex glyphs) are unchanged in this slice.
- U17 crowded-layout items shipped through 0.95–0.98; remaining are polish preferences.

## Next steps

1. Done: merged #137 and live-installed 0.98.0.
2. Continue UX polish or admin slices as operator priority allows.
