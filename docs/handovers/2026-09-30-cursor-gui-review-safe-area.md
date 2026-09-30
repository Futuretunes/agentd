# 2026-09-30 — 0.121.0: Review footer safe-area (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Phone file-review sticky footer must clear the home indicator
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.121.0
- Branch and base: `feat/gui-review-safe-area` on `main` (0.120.0)
- Implementation commit(s): 7a28adf
- PR: #183

## Changes and relevant files

- Phone `#review-actions` sticks to `bottom: 0` with `safe-area-inset-bottom` padding.
- Package 0.121.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #183; live-installed on 192.168.1.20 (0.121.0 / eaa7d29).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.120.0 / revert of #183.

## Constraints and known issues

- Desktop sticky offset unchanged.

## Next steps

1. Done: merged #183 and live-installed 0.121.0.
2. Continue UX polish or admin slices as operator priority allows.
