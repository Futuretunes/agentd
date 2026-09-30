# 2026-09-30 — 0.124.0: Conversation region busy state (UX-3 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation region should announce when workspace refresh is in progress
- Status: implemented
- Release: 0.124.0
- Branch and base: `feat/gui-detail-busy` on `main` (0.123.0)
- Implementation commit(s): d79666c
- PR: pending

## Changes and relevant files

- `#detail` starts with `aria-busy="false"`; `refresh()` toggles it true/false around the poll.
- Package 0.124.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Short polls may clear busy quickly; still useful for slower refreshes.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
