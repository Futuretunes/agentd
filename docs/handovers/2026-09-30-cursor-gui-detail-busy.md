# 2026-09-30 — 0.124.0: Conversation region busy state (UX-3 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation region should announce when workspace refresh is in progress
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.124.0
- Branch and base: `feat/gui-detail-busy` on `main` (0.123.0)
- Implementation commit(s): 135f6cd
- PR: #189

## Changes and relevant files

- `#detail` starts with `aria-busy="false"`; `refresh()` toggles it true/false around the poll.
- Package 0.124.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #189; live-installed on 192.168.1.20 (0.124.0 / f57831a).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.123.0 / revert of #189.

## Constraints and known issues

- Short polls may clear busy quickly; still useful for slower refreshes.

## Next steps

1. Done: merged #189 and live-installed 0.124.0.
2. Continue UX polish or admin slices as operator priority allows.
