# 2026-09-29 — 0.73.0: Backups rollback target + restore entry

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next administration slice after CLI helper
- Status: implemented; not installed
- Release: 0.73.0
- Branch and base: `feat/gui-backup-restore` on `main` (0.72.1)
- PR: #85

## Changes and relevant files

- `scripts/admin_backups.py`: include sanitized rollback target metadata; mark matching backup with `rollbackTarget`.
- Settings > Backups: highlight the rollback target and open the existing Updates rollback review from there.
- Does not restore arbitrary older backups yet—only the managed rollback candidate.

## Validation evidence

- `python3 -B test/admin_backups.py` passed; typecheck pending with commit.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Next: Claude/Codex approved CLI helpers, or restore of a selected non-rollback backup with stronger gates.
