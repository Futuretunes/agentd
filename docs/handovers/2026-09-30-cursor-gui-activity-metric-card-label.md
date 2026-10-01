# 2026-09-30 — 0.370.0: Activity metric card accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity metric card accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.370.0
- Implementation commit(s): 6957dc8
- PR: #680

## Changes and relevant files

- See feature PR #680.
- Package 0.370.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #680; live-installed on 192.168.1.20 (0.370.0 / 6957dc8aa922d80e97c79b5182fc27fed2522062).
- Archive SHA-256: `c459ce2b6129b32f9c9bf0ea0ac25d93b62a545ce58e6969e90e469560bf303f`
- Revision: `6957dc8aa922d80e97c79b5182fc27fed2522062`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #680.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #680 and live-installed 0.370.0.
2. Continue a11y form labels.
