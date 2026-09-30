# 2026-09-30 — 0.141.0: Decorative turn agent brand glyphs (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Turn agent labels must not expose decorative brand glyphs to assistive tech
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.141.0
- Branch and base: `feat/gui-turn-adapter-glyph-a11y` on `main` (0.140.0)
- Implementation commit(s): a1e3271
- PR: #222

## Changes and relevant files

- Turn agent labels wrap ◈/◉/✳ glyphs in `aria-hidden` with plain Claude/Codex/Cursor/Base text.
- Package 0.141.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #222; live-installed on 192.168.1.20 (0.141.0 / a1e3271).
- Archive SHA-256: `c8de216fa571a1b258a19bd22aee2c777e729b487fcd44527d33ea8fe9107f86`
- Revision: `a1e32716222e65420ed24c7f873730c4f39c330d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.140.0 / revert of #222.

## Constraints and known issues

- Visible glyphs remain for sighted users; only AT naming changes.

## Next steps

1. Done: merged #222 and live-installed 0.141.0.
2. Continue UX polish or admin slices as operator priority allows.
