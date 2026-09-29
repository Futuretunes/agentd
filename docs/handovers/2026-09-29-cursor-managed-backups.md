# 2026-09-29 — 0.67.0: managed backups list and cleanup

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next administration slice after Agents & CLIs
- Status: implemented; not installed
- Release: 0.67.0
- Branch and base: `feat/gui-managed-backups` on `feat/gui-cli-versions`
- PR: (open after push)

## Changes and relevant files

- `scripts/admin_backups.py`: sanitized listing and fingerprint-bound prune via existing `backup_retention`.
- Admin helper/client/runner/gateway/mobile: `admin-backups` / `admin-backups-prune` with step-up preview.
- Settings > Backups UI; restore still via Updates rollback; worktree cleanup remains in Activity.
- Tests: `test/admin_backups.py`.

## Validation evidence

- `npm run typecheck` passed; `python3 -B test/admin_backups.py` passed; gateway/access-key tests passed.
- Full Linux isolation CI pending on push.

## Deployment and rollback

- Not installed. No schema migration. Requires administration helper already present.

## Constraints and known issues

- Host paths are never returned to the browser; only backup id, version, age, size, pinned/eligible.
- Does not restore arbitrary backups from the phone; version restore remains Settings > Updates rollback.

## Next steps

1. Merge onto `main` when CI is green.
2. Next administration slice: schema-backed configuration pages.
