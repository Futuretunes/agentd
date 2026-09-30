# 2026-09-30 — 0.216.0: Visible History filter label (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: History filter select must show a visible Show label
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.216.0
- Branch and base: `feat/gui-history-filter-label` on `main` (0.215.0)
- Implementation commit(s): e375bd9
- PR: #373

## Changes and relevant files

- `#history-filter` gains a visible `Show` label; keeps `aria-label="History filter"`.
- Package 0.216.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #373; live-installed on 192.168.1.20 (0.216.0 / e375bd9).
- Archive SHA-256: `3ca47ad8307c0ce1ecd568cd46cce4ae4ace0931e7f194be67db5e2363e2c034`
- Revision: `e375bd9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.215.0 / revert of #373.

## Constraints and known issues

None beyond ordinary label visibility.

## Next steps

1. Done: merged #373 and live-installed 0.216.0.
2. Align `.actions label` spacing for compact filter rows next.
