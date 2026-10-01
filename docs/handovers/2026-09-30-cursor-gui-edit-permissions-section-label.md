# 2026-09-30 — 0.333.0: Edit permissions accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Edit permissions form section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.333.0
- Branch and base: `feat/gui-edit-permissions-section-label` on `main` (0.332.0)
- Implementation commit(s): 85f4470
- PR: #607

## Changes and relevant files

- Edit permissions form section sets `aria-label="Edit permissions"`.
- Package 0.333.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #607; live-installed on 192.168.1.20 (0.333.0 / 85f447021dc1d8338f9637555383b41f4271545e).
- Archive SHA-256: `0275cb211740962c72dba58fbee6a646ee0d96c6066f3decaf804c7018fb6c95`
- Revision: `85f447021dc1d8338f9637555383b41f4271545e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.332.0 / revert of #607.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #607 and live-installed 0.333.0.
2. Label Update backups next.
