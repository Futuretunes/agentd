# 2026-09-30 — 0.74.0: Restore a selected older managed backup

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next administration slice after 0.73 backups rollback entry
- Status: implemented; not installed
- Release: 0.74.0
- Branch and base: `feat/gui-backup-restore-selected` on `main` (0.73.0)

## Changes and relevant files

- `scripts/run_rollback.py`: `by_id` / `restorable` / `--backup-id` restore of a specific older compatible managed backup (same save-current-first path as rollback).
- `deploy/agentd-restore@.service` installed beside rollback by `apply_updates.py` (no `restoreUnit` config key, so older releases stay configuration-compatible).
- `scripts/admin_backups.py`: mark restorable items when the restore unit file is present.
- Admin helper/client/runner/gateway/mobile: `backups-restore` / `admin-backups-restore` with step-up preview.
- Settings > Backups: Review restore for older restorable backups.
- Tests: `test/admin_backups.py`, `test/in_app_rollback.py`, `test/in-app-updates.test.mjs`.

## Validation evidence

- `python3 -B test/admin_backups.py` passed
- `python3 -B test/in_app_rollback.py` passed
- `node --test test/in-app-updates.test.mjs` passed
- `npm run typecheck` passed

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20; `apply_updates.py` enables `agentd-restore@.service` if missing.
2. Next backlog: Claude/Codex approved CLI helpers, or further configuration mutations.
