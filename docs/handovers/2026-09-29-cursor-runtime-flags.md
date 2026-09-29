# 2026-09-29 — 0.70.0: runtime flag configuration mutations

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next configuration mutation after adapter policy
- Status: implemented; not installed
- Release: 0.70.0
- Branch and base: `feat/gui-runtime-flags` on `main` (0.69.0)
- PR: (open after push)

## Changes and relevant files

- `scripts/admin_runtime_flags.py`: read/update allowlisted `AGENTD_STRICT_WORKERS`, `AGENTD_CREDENTIAL_RENEWAL`, `AGENTD_CODEX_CHAT`; refuses renewal/chat without hardened workers.
- Admin helper/client/runner/gateway/mobile: `admin-runtime-flags` / `admin-runtime-flags-apply` with step-up preview.
- Settings > Configuration: runtime flags form and restart CTA.

## Validation evidence

- Local typecheck and Python/unit tests pending with commit.
- CI pending on push.

## Next steps

1. Merge when CI is green.
2. Next: further configuration mutations (profile/hardening/TLS) or approved native CLI binary helper.
