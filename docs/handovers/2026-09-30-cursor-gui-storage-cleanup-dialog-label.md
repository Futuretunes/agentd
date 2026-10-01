# 2026-09-30 — 0.383.0: Storage cleanup dialog accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Storage cleanup dialog accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.383.0
- Implementation commit(s): 3295555
- PR: #706

## Changes and relevant files

- See feature PR #706.
- Package 0.383.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #706; live-installed on 192.168.1.20 (0.383.0 / 3295555164a3c8a071aa7cf85186e66c08e21c5c).
- Archive SHA-256: `df449dfd2874cbd02f5a37fdd44eaf82bfe938f9ded2c29a9c055854b9bc063a`
- Revision: `3295555164a3c8a071aa7cf85186e66c08e21c5c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #706.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #706 and live-installed 0.383.0.
2. Continue a11y form labels.
