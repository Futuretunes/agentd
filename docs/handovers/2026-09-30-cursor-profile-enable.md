# 2026-09-30 — 0.76.0: Configuration profile enable

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: enable missing resource profile / gateway hardening from Settings > Configuration
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.76.0
- Branch and base: `feat/gui-profile-enable` on `main` (0.75.0)
- PR: #91

## Changes and relevant files

- `deploy/agentd-apply-resources.service` / `deploy/agentd-apply-gateway-hardening.service`: fixed oneshot jobs for the existing apply scripts.
- `scripts/apply_profiles.py`: installs those units without new update.json keys.
- `scripts/admin_profiles.py`: bounded snapshot and approval-gated start (resource then hardening; no disable).
- Helper/client/runner/gateway/mobile/UI: step-up `/api/profiles` preview + enable.
- Docs: administration backlog and handover.

## Validation evidence

- `python3 -B test/admin_profiles.py`
- CI green on #91; live install on 192.168.1.20 via `update.py install`; `apply_profiles.py` enabled both oneshot units. Host already has both profiles applied (`canEnable*` false).

## Next steps

1. Next backlog: notifications (roadmap item 5 / ntfy) or remaining Configuration polish.
2. Host already has both profiles enabled; UI shows status without enable actions until a host is missing them.
