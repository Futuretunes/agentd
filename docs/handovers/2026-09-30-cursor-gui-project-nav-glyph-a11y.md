# 2026-09-30 — 0.142.0: Decorative project sidebar glyph (UX-5 / U17, UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Project sidebar rows must not expose decorative ▱ to assistive tech
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.142.0
- Branch and base: `feat/gui-project-nav-glyph-a11y` on `main` (0.141.0)
- Implementation commit(s): 426b524
- PR: #224

## Changes and relevant files

- Project nav rows wrap ▱ in `aria-hidden`; title text stays visible.
- Package 0.142.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #224; live-installed on 192.168.1.20 (0.142.0 / 426b524).
- Archive SHA-256: `b3ebaba2a5560a38d2d3064e491b969f33a0f7f65ef4db20a1ecc16748cde7ed`
- Revision: `426b524174276e101109246b9b3145cf83d7e6ab`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.141.0 / revert of #224.

## Constraints and known issues

- Accessible names still come from `projectNavLabel` aria-labels.

## Next steps

1. Done: merged #224 and live-installed 0.142.0.
2. Continue UX polish or admin slices as operator priority allows.
