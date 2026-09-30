# 2026-09-30 — 0.302.0: Activity storage accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity storage section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.302.0
- Branch and base: `feat/gui-activity-storage-label` on `main` (0.301.0)
- Implementation commit(s): c735179
- PR: #545

## Changes and relevant files

- Activity storage `operation-section` sets `aria-label="Activity storage"`.
- Package 0.302.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #545; live-installed on 192.168.1.20 (0.302.0 / c73517946cfe6ee778ebd054c20b2f33dba3527c).
- Archive SHA-256: `d9b5cdbccfd8ba8daf6901418c47df5a8b999626d03b14ca5fc4b9e643f1bd7e`
- Revision: `c73517946cfe6ee778ebd054c20b2f33dba3527c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.301.0 / revert of #545.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #545 and live-installed 0.302.0.
2. Label Activity agent accounts next.
