# 2026-09-30 — 0.560.0: Eyebrow line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Eyebrow line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.560.0
- Implementation commit(s): 8210bc6
- PR: #1054

## Changes and relevant files

- See feature PR #1054.
- Package 0.560.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1054; live-installed on 192.168.1.20 (0.560.0 / 8210bc603d6797d9564d023c073d89f0af3fd13e).
- Archive SHA-256: `f8c478244aa72ab06f08e4479dfd524379c031b3ee565ef8ad81b3ad91ba86cd`
- Revision: `8210bc603d6797d9564d023c073d89f0af3fd13e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1054.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1054 and live-installed 0.560.0.
2. Continue a11y form labels.
