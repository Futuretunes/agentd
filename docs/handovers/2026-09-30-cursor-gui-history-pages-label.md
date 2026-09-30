# 2026-09-30 — 0.146.0: History pagination accessible name (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: History paging controls must expose a stable group name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.146.0
- Branch and base: `feat/gui-history-pages-label` on `main` (0.145.0)
- Implementation commit(s): 6cb81d4
- PR: #233

## Changes and relevant files

- `#history-pages` sets `aria-label="History pagination"`.
- Package 0.146.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #233; live-installed on 192.168.1.20 (0.146.0 / 6cb81d4).
- Archive SHA-256: `e4f99f3dd027cf696ee67855d061976a6a18b795eeecbec9b72a5f6680be1706`
- Revision: `6cb81d4a4b2a0ed925c498450436bb825c6150eb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.145.0 / revert of #233.

## Constraints and known issues

- Newest results / More results buttons keep their own labels.

## Next steps

1. Done: merged #233 and live-installed 0.146.0.
2. Continue UX polish or admin slices as operator priority allows.
