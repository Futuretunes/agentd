# 2026-09-30 — 0.74.1: Restore selected backup without restoreUnit config key

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: fix 0.74.0 so older managed backups remain configuration-compatible
- Status: implemented; live-installed as 0.74.1 on 192.168.1.20
- Release: 0.74.1
- Branch and base: `fix/restore-no-config-key` on `main` (0.74.0)
- PR: #87
- Related: [0.74.0 handover](2026-09-30-cursor-backup-restore-selected.md)

## Changes and relevant files

- Remove `restoreUnit` from `update.py` optional fields.
- `apply_updates.py` installs `agentd-restore@.service` beside rollback without a new update.json key.
- `admin_backups.py` enables restore listing from the unit file presence + `rollbackUnit`.

## Validation evidence

- `python3 -B test/admin_backups.py` and `test/in_app_rollback.py` passed; typecheck passed.

## Next steps

1. Merge when CI is green; live-install; remove any host `restoreUnit` key left from 0.74.0.
2. Next backlog: Claude/Codex approved CLI helpers.
