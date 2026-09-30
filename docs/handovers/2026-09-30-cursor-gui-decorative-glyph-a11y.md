# 2026-09-30 — 0.135.0: Decorative drawer/menu glyphs (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Named drawer/menu controls must not expose decorative glyph text to assistive tech; Attach owns the file picker
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.135.0
- Branch and base: `feat/gui-decorative-glyph-a11y` on `main` (0.134.0)
- Implementation commit(s): 8624ea5
- PR: #211

## Changes and relevant files

- Drawer open/close and conversation-menu glyphs wrapped in `aria-hidden`.
- `#files` marked `aria-hidden` (Attach remains the accessible control).
- Package 0.135.0; HTML assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #211; live-installed on 192.168.1.20 (0.135.0 / 8624ea5).
- Archive SHA-256: `10e0b0ac32669f96fc80860a8bcd7882f2ffc36416819463cb7bfe5b2869fca7`
- Revision: `8624ea5df5ef636ebe792746338d9da7b9d60904`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.134.0 / revert of #211.

## Constraints and known issues

- Native file picker still opens via Attach; hiding `#files` does not block programmatic click.

## Next steps

1. Done: merged #211 and live-installed 0.135.0.
2. Continue UX polish or admin slices as operator priority allows.
