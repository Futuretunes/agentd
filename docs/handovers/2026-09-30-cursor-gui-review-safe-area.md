# 2026-09-30 — 0.121.0: Review footer safe-area (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Phone file-review sticky footer must clear the home indicator
- Status: implemented
- Release: 0.121.0
- Branch and base: `feat/gui-review-safe-area` on `main` (0.120.0)
- Implementation commit(s): 69175b2
- PR: #183

## Changes and relevant files

- Phone `#review-actions` sticks to `bottom: 0` with `safe-area-inset-bottom` padding.
- Package 0.121.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Desktop sticky offset unchanged.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
