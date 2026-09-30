# 2026-09-30 — 0.76.0: Configuration profile enable

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: enable missing resource profile / gateway hardening from Settings > Configuration
- Status: implemented; pending merge and live-install
- Release: 0.76.0
- Branch and base: `feat/gui-profile-enable` on `main` (0.75.0)

## Changes and relevant files

- `deploy/agentd-apply-resources.service` / `deploy/agentd-apply-gateway-hardening.service`: fixed oneshot jobs for the existing apply scripts.
- `scripts/apply_profiles.py`: installs those units without new update.json keys.
- `scripts/admin_profiles.py`: bounded snapshot and approval-gated start (resource then hardening; no disable).
- Helper/client/runner/gateway/mobile/UI: step-up `/api/profiles` preview + enable.
- Docs: administration backlog and handover.

## Validation evidence

- `python3 -B test/admin_profiles.py`
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20; run `apply_profiles.py` once if units are missing.
2. Host already has both profiles enabled; UI shows status without enable actions until a host is missing them.
3. Next backlog: remaining admin/UX items (notifications, access-key polish, or UX polish slices).
