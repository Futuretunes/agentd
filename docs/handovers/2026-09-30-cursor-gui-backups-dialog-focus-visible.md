# 2026-09-30 — 0.428.0: Backups dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Backups dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.428.0
- Implementation commit(s): b5d8d29
- PR: #795

## Changes and relevant files

- See feature PR #795.
- Package 0.428.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #795; live-installed on 192.168.1.20 (0.428.0 / b5d8d292c597c95930dc7271068005d41f919ce2).
- Archive SHA-256: `51c412442deb717cbb3b5962510e2a69a36eca5d30affd1dbe91dbc0f29f540f`
- Revision: `b5d8d292c597c95930dc7271068005d41f919ce2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #795.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #795 and live-installed 0.428.0.
2. Continue a11y form labels.
