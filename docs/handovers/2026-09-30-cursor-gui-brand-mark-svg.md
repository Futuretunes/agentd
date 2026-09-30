# 2026-09-30 — 0.98.0: SVG brand mark (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Replace the text “◈” logo glyph with a real SVG mark on brand surfaces
- Status: implemented
- Release: 0.98.0
- Branch and base: `feat/gui-brand-mark-svg` on `main` (0.97.0)
- Implementation commit(s): 7ffd556
- PR: (filled after open)

## Changes and relevant files

- Login and sidebar brand markup use an inline SVG diamond; welcome empty state uses `brandMarkElement`.
- `brandMarkElement` in `public/ui.js`; CSS for `.brand-mark`.
- Package 0.98.0; coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Per-turn adapter prefixes (Cursor/Claude/Codex glyphs) are unchanged in this slice.
- U17 crowded-layout items shipped through 0.95–0.98; remaining are polish preferences.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
