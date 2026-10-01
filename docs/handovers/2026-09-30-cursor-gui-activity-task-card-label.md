# 2026-09-30 — 0.374.0: Activity task card accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity task card accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.374.0
- Implementation commit(s): c86ab4b
- PR: #688

## Changes and relevant files

- See feature PR #688.
- Package 0.374.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #688; live-installed on 192.168.1.20 (0.374.0 / c86ab4b26f2895cd3f914bc247c2f1685c597045).
- Archive SHA-256: `d9602215a86a4d9c7455eb00880d558dc992adc2e819a3d83a82df3051d7983d`
- Revision: `c86ab4b26f2895cd3f914bc247c2f1685c597045`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #688.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #688 and live-installed 0.374.0.
2. Continue a11y form labels.
