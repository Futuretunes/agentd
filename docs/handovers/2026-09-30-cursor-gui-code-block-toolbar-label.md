# 2026-09-30 — 0.404.0: Code block toolbar accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Code block toolbar accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.404.0
- Implementation commit(s): 9397f57
- PR: #748

## Changes and relevant files

- See feature PR #748.
- Package 0.404.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #748; live-installed on 192.168.1.20 (0.404.0 / 9397f571367efbc62188290fde934879cfab0b2c).
- Archive SHA-256: `eb01aeb0f1911e1038c39ea8b22cbec5a73691522a886a87ba955b0435a73b5d`
- Revision: `9397f571367efbc62188290fde934879cfab0b2c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #748.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #748 and live-installed 0.404.0.
2. Continue a11y form labels.
