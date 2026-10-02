# 2026-09-30 — 0.600.0: Phone tools select touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone tools select touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.600.0
- Implementation commit(s): cf1e9d0
- PR: #1134

## Changes and relevant files

- See feature PR #1134.
- Package 0.600.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1134; live-installed on 192.168.1.20 (0.600.0 / cf1e9d064510e289066fa7cfa4695808614c5379).
- Archive SHA-256: `5a37fa6f09a7516150e098f281d75778c83bf790932315c30fdc342ef42ddbca`
- Revision: `cf1e9d064510e289066fa7cfa4695808614c5379`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1134.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1134 and live-installed 0.600.0.
2. Continue a11y form labels.
