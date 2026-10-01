# 2026-09-30 — 0.371.0: Update backup card accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Update backup card accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.371.0
- Implementation commit(s): 2ef9121
- PR: #682

## Changes and relevant files

- See feature PR #682.
- Package 0.371.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #682; live-installed on 192.168.1.20 (0.371.0 / 2ef9121c932f897c8d7b7e2d74e99cbf8d62b1bb).
- Archive SHA-256: `c2077eb7b684e47659e9bc3d95832a7cf677a1d3447231950798e43e90305b21`
- Revision: `2ef9121c932f897c8d7b7e2d74e99cbf8d62b1bb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #682.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #682 and live-installed 0.371.0.
2. Continue a11y form labels.
