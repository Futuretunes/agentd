# 2026-09-30 — 0.352.0: Confirm delete access-key recovery form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Confirm delete access-key recovery form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.352.0
- Implementation commit(s): f80201d
- PR: #645

## Changes and relevant files

- See feature PR #645.
- Package 0.352.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #645; live-installed on 192.168.1.20 (0.352.0 / f80201d0013f32b524dd4b703c212d991c532dfb).
- Archive SHA-256: `d526334048e1e27761d2bade211a37f077a3cb9047b9e44605d2fc19a13ce35b`
- Revision: `f80201d0013f32b524dd4b703c212d991c532dfb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #645.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #645 and live-installed 0.352.0.
2. Continue a11y form labels.
