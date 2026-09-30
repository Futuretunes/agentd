# 2026-09-30 — 0.130.0: Main desk landmark name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: The conversation `<main>` landmark must expose a stable accessible name
- Status: implemented
- Release: 0.130.0
- Branch and base: `feat/gui-main-landmark` on `main` (0.129.0)
- Implementation commit(s): 31a4e83
- PR: pending

## Changes and relevant files

- `main.desk` sets `aria-label="Conversation workspace"`.
- Package 0.130.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Sidebar already has its own navigation landmark.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
