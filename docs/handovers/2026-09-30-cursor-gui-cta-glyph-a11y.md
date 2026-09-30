# 2026-09-30 — 0.152.0: Decorative CTA and Send glyphs (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: New conversation/project CTAs and Send must hide decorative ＋/↑ glyphs
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.152.0
- Branch and base: `feat/gui-cta-glyph-a11y` on `main` (0.151.0)
- Implementation commit(s): 2d04f01
- PR: #245

## Changes and relevant files

- Sidebar and empty-list New conversation/project CTAs wrap ＋ in `aria-hidden`.
- Send wraps ↑ in `aria-hidden` beside its accessible name.
- Package 0.152.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #245; live-installed on 192.168.1.20 (0.152.0 / 2d04f01).
- Archive SHA-256: `ad3fc692c892af1c39379d9feac0e3414da1647633e919d7e7117be80e3bc6e3`
- Revision: `2d04f013588386059c2be3febafe9a5ae4e19399`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.151.0 / revert of #245.

## Constraints and known issues

- Accessible names remain on the buttons; glyphs stay visual-only.

## Next steps

1. Done: merged #245 and live-installed 0.152.0.
2. Continue UX polish or admin slices as operator priority allows.
