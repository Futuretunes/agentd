# 2026-09-30 — 0.137.0: Decorative dialog close glyphs (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog Close controls must expose names without decorative × text
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.137.0
- Branch and base: `feat/gui-dialog-close-glyph-a11y` on `main` (0.136.0)
- Implementation commit(s): 2222fb8
- PR: #214

## Changes and relevant files

- Static dialog Close buttons wrap × in `aria-hidden`.
- Dynamic account dialog close matches the same pattern.
- Package 0.137.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #214; live-installed on 192.168.1.20 (0.137.0 / 2222fb8).
- Archive SHA-256: `f4a7fa7c796739e9addcbe4b8f42a4304dd076209b80a004357df279528d724c`
- Revision: `2222fb8082e310d311945c5c12ff622848a9283a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.136.0 / revert of #214.

## Constraints and known issues

- Cancel-labelled dialogs (New project, publication confirm) keep word labels.

## Next steps

1. Done: merged #214 and live-installed 0.137.0.
2. Continue UX polish or admin slices as operator priority allows.
