# 2026-09-30 — 0.128.0: Phone header safe-area (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Phone conversation header must clear the status bar / notch
- Status: implemented
- Release: 0.128.0
- Branch and base: `feat/gui-header-safe-area` on `main` (0.127.0)
- Implementation commit(s): bfb0fc9
- PR: pending

## Changes and relevant files

- Phone `header` padding-top uses `max(12px, env(safe-area-inset-top))`.
- Package 0.128.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Desktop header padding unchanged.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
