# 2026-09-30 — 0.127.0: Compose form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer form must expose a stable accessible name and point at the hint regions
- Status: implemented
- Release: 0.127.0
- Branch and base: `feat/gui-compose-label` on `main` (0.126.0)
- Implementation commit(s): 2d97433
- PR: pending

## Changes and relevant files

- `#compose` sets `aria-label="Compose message"` and `aria-describedby` for hint / policy / draft hints.
- Package 0.127.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Empty hint regions remain in describedby so updates stay associated.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
