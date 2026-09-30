# 2026-09-30 — 0.277.0: Backups dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Backups dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.277.0
- Branch and base: `feat/gui-backups-head-label` on `main` (0.276.0)
- Implementation commit(s): 2971ee4
- PR: #495

## Changes and relevant files

- Backups dialog `.review-head` sets `role="group"` and `aria-label="Backups heading"`.
- Package 0.277.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #495; live-installed on 192.168.1.20 (0.277.0 / 2971ee490e80ad1e96f6956904bfb9fe8ba53376).
- Archive SHA-256: `c9d89563270a22b589b27191b62077229fbac8d28a31048b438de3c9fdd881b5`
- Revision: `2971ee490e80ad1e96f6956904bfb9fe8ba53376`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.276.0 / revert of #495.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #495 and live-installed 0.277.0.
2. Label CLI dialog heading next.
