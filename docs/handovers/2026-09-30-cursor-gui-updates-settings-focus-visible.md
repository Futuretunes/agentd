# 2026-09-30 — 0.494.0: Updates settings focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Updates settings focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.494.0
- Implementation commit(s): ede6f12
- PR: #923

## Changes and relevant files

- See feature PR #923.
- Package 0.494.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #923; live-installed on 192.168.1.20 (0.494.0 / ede6f1252d59f1897da281005f49a7a862a96829).
- Archive SHA-256: `e5c1ad441727ea988de9bd13f6bcd1a38fe453529c6294da74fb9aa95a990829`
- Revision: `ede6f1252d59f1897da281005f49a7a862a96829`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #923.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #923 and live-installed 0.494.0.
2. Continue a11y form labels.
