# 2026-09-30 — 0.568.0: Phone turn status font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone turn status font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.568.0
- Implementation commit(s): 734251c
- PR: #1070

## Changes and relevant files

- See feature PR #1070.
- Package 0.568.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1070; live-installed on 192.168.1.20 (0.568.0 / 734251c738169b72cc14f9387e7b9b1939ad02be).
- Archive SHA-256: `43e4811916e0b13b43ab0b4b6f844c980207aad8508e8e59e80e1cf94aba82c3`
- Revision: `734251c738169b72cc14f9387e7b9b1939ad02be`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1070.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1070 and live-installed 0.568.0.
2. Continue a11y form labels.
