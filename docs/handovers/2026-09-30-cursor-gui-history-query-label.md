# 2026-09-30 — 0.237.0: History search accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History search input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.237.0
- Branch and base: `feat/gui-history-query-label` on `main` (0.236.0)
- Implementation commit(s): 52873f2
- PR: #415

## Changes and relevant files

- `#history-query` keeps its visible search label and sets `aria-label="History search"`.
- Package 0.237.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #415; live-installed on 192.168.1.20 (0.237.0 / 676832dfca5e69e52018cabe090276d08ef16d41).
- Archive SHA-256: `c8c9d439d52a2fb5fe7d8aeada0c7840986a5db40e3756def7f3fe276dc27077`
- Revision: `676832dfca5e69e52018cabe090276d08ef16d41`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.236.0 / revert of #415.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #415 and live-installed 0.237.0.
2. Label composer prompt next.
