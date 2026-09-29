# 2026-09-29 — 0.71.0: TLS certificate replacement

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next configuration mutation after runtime flags
- Status: implemented; not installed
- Release: 0.71.0
- Branch and base: `feat/gui-tls-replace` on `main` (0.70.0)
- PR: #81

## Changes and relevant files

- `scripts/admin_tls.py`: read certificate metadata; replace managed `/etc/agentd-web/tls.crt` + `tls.key` after PEM/match/expiry checks; preserves ownership/mode.
- `scripts/admin_configuration.py`: richer TLS metadata via `admin_tls.metadata`.
- Admin helper/client/runner/gateway/mobile: `admin-tls-replace` with step-up preview; helper request cap 64 KiB; longer helper/bridge timeouts for OpenSSL work.
- Settings > Configuration: TLS overview (subject/issuer/fingerprint/days) and replace form; gateway restart CTA afterward.
- Also fixes adapter/runtime apply confirmation to re-enter the access key (same pattern as service restart).

## Validation evidence

- Local typecheck and Python/unit tests pending with commit.
- CI pending on push.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Next: profile/hardening mutations or approved native CLI binary helper.
