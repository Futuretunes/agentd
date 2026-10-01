# 2026-09-30 — 0.446.0: Sidebar links focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sidebar links focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.446.0
- Implementation commit(s): 288a3ba
- PR: #830

## Changes and relevant files

- See feature PR #830.
- Package 0.446.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #830; live-installed on 192.168.1.20 (0.446.0 / 288a3ba90a5177839c684212494a5f997489b53c).
- Archive SHA-256: `fb8bed0029a56f77a0fe6c6a4a1cc50bb17c7f9670b7b8f4abcc024d3fd48100`
- Revision: `288a3ba90a5177839c684212494a5f997489b53c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #830.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #830 and live-installed 0.446.0.
2. Continue a11y form labels.
