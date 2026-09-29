# 2026-09-29 — 0.68.0: read-only configuration overview

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next administration slice after managed backups
- Status: implemented; not installed
- Release: 0.68.0
- Branch and base: `feat/gui-configuration` on `feat/gui-managed-backups`
- PR: (open after push)

## Changes and relevant files

- `scripts/admin_configuration.py`: sanitized flags for resource profile, hardening, gateway separation, helper presence, TLS expiry string.
- Settings > Configuration read-only page with deep links to GitHub and agent defaults.
- Mutations for profile/hardening/TLS replacement remain future work.

## Validation evidence

- Local typecheck and `test/admin_configuration.py` pending with commit.
- CI pending on push.

## Next steps

1. Merge after CI.
2. Remaining: configuration mutations; approved native CLI binary helper; ntfy notifications.
