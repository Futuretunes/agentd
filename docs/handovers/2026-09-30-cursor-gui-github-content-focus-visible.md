# 2026-09-30 — 0.470.0: GitHub content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.470.0
- Implementation commit(s): e4e564c
- PR: #876

## Changes and relevant files

- See feature PR #876.
- Package 0.470.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #876; live-installed on 192.168.1.20 (0.470.0 / e4e564cde4149a82ec16ccd761af607f96d124dd).
- Archive SHA-256: `3bb835bb811087bcf50043e67fb59978551f9a0a69c664f3167607bad41b38d3`
- Revision: `e4e564cde4149a82ec16ccd761af607f96d124dd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #876.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #876 and live-installed 0.470.0.
2. Continue a11y form labels.
