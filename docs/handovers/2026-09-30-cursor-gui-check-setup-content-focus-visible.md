# 2026-09-30 — 0.471.0: Check setup content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Check setup content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.471.0
- Implementation commit(s): 57c2381
- PR: #878

## Changes and relevant files

- See feature PR #878.
- Package 0.471.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #878; live-installed on 192.168.1.20 (0.471.0 / 57c2381b477c41bd378f53b7bbad68466b90b9bf).
- Archive SHA-256: `306d9accea4933b17ed0844551f097ce18d33dc1f9e2cbd6bd378cd00c9796d0`
- Revision: `57c2381b477c41bd378f53b7bbad68466b90b9bf`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #878.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #878 and live-installed 0.471.0.
2. Continue a11y form labels.
