# 2026-09-30 — 0.484.0: Revision form focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Revision form focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.484.0
- Implementation commit(s): 7f50880
- PR: #903

## Changes and relevant files

- See feature PR #903.
- Package 0.484.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #903; live-installed on 192.168.1.20 (0.484.0 / 7f508808e692e65715f12303ea7ce6306383d772).
- Archive SHA-256: `0c0f5839eb6d8ab90532da20a43dfe19274dae24452b8ddb66859a209f4ba83b`
- Revision: `7f508808e692e65715f12303ea7ce6306383d772`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #903.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #903 and live-installed 0.484.0.
2. Continue a11y form labels.
