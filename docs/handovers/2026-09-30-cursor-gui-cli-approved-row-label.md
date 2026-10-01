# 2026-09-30 — 0.373.0: Approved CLI package row accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Approved CLI package row accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.373.0
- Implementation commit(s): a4fd06f
- PR: #686

## Changes and relevant files

- See feature PR #686.
- Package 0.373.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #686; live-installed on 192.168.1.20 (0.373.0 / a4fd06fe0d0a10b534665dbb65ef053419d40891).
- Archive SHA-256: `e6ebb9ead03c27f1836ed6fa7fc84f0b19ef001ecfe6ebd021eb4da27f94c7ed`
- Revision: `a4fd06fe0d0a10b534665dbb65ef053419d40891`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #686.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #686 and live-installed 0.373.0.
2. Continue a11y form labels.
