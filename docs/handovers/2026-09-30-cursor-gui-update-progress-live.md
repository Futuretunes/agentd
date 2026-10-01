# 2026-09-30 — 0.395.0: Update progress live region (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Update progress live region
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.395.0
- Implementation commit(s): 3b98077
- PR: #730

## Changes and relevant files

- See feature PR #730.
- Package 0.395.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #730; live-installed on 192.168.1.20 (0.395.0 / 3b9807711204b574cbf17371b519b1bf0b452729).
- Archive SHA-256: `e1270cec66697207e45d0378e660e0ec82ea0ea1da5deaaf53b3bd804d7cf88e`
- Revision: `3b9807711204b574cbf17371b519b1bf0b452729`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #730.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #730 and live-installed 0.395.0.
2. Continue a11y form labels.
