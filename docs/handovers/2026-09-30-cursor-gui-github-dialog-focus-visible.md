# 2026-09-30 — 0.427.0: GitHub dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.427.0
- Implementation commit(s): 580053e
- PR: #793

## Changes and relevant files

- See feature PR #793.
- Package 0.427.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #793; live-installed on 192.168.1.20 (0.427.0 / 580053e6170abfad03a8320eb2369d4a0301a1d3).
- Archive SHA-256: `61e26afefc480483a3b337f9be44caeff71c8e891e0d256d8e55f99d02ec0496`
- Revision: `580053e6170abfad03a8320eb2369d4a0301a1d3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #793.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #793 and live-installed 0.427.0.
2. Continue a11y form labels.
