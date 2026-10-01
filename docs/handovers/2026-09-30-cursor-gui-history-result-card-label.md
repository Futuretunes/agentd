# 2026-09-30 — 0.377.0: History result card accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History result card accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.377.0
- Implementation commit(s): 9f3a1aa
- PR: #694

## Changes and relevant files

- See feature PR #694.
- Package 0.377.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #694; live-installed on 192.168.1.20 (0.377.0 / 9f3a1aa674c7b06b9e9258de72c65a6724f96599).
- Archive SHA-256: `1333349ba654c7ba65d3f797539379e2afc51ee1eed734407546826d09d071ef`
- Revision: `9f3a1aa674c7b06b9e9258de72c65a6724f96599`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #694.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #694 and live-installed 0.377.0.
2. Continue a11y form labels.
