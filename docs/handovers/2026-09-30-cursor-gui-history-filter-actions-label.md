# 2026-09-30 — 0.286.0: History filter actions accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History filter actions group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.286.0
- Branch and base: `feat/gui-history-filter-actions-label` on `main` (0.285.0)
- Implementation commit(s): 1d99f6c
- PR: #513

## Changes and relevant files

- History search form `.actions` sets `role="group"` and `aria-label="History filter actions"`.
- Package 0.286.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #513; live-installed on 192.168.1.20 (0.286.0 / 1d99f6ca4dca3bd7126a89a9dd90f955050de0dc).
- Archive SHA-256: `5bb2bafd8238f073235b583383f1d52e5ed6ed84a2d2285a06a0bd1580f334c9`
- Revision: `1d99f6ca4dca3bd7126a89a9dd90f955050de0dc`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.285.0 / revert of #513.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #513 and live-installed 0.286.0.
2. Label Sign out settings section next.
