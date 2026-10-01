# 2026-09-30 — 0.519.0: Tabindex focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Tabindex focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.519.0
- Implementation commit(s): 829f95a
- PR: #973

## Changes and relevant files

- See feature PR #973.
- Package 0.519.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #973; live-installed on 192.168.1.20 (0.519.0 / 829f95a68ee90f6ae3b3a72e0c819599619e18b5).
- Archive SHA-256: `cfbc9d5c2980800bbf52ce7e95c1e655a5d23b950c1e79ad1681f3b2ee2f5ae5`
- Revision: `829f95a68ee90f6ae3b3a72e0c819599619e18b5`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #973.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #973 and live-installed 0.519.0.
2. Continue a11y form labels.
