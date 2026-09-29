# 2026-09-29 — 0.71.0: TLS certificate replacement

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: next configuration mutation after runtime flags
- Status: implemented and live-installed on 192.168.1.20
- Release: 0.71.0
- Branch and base: `feat/gui-tls-replace` on `main` (0.70.0)
- Implementation commit(s): `cefc2ed` / merge `ba7fea5`
- PR: #81

## Changes and relevant files

- `scripts/admin_tls.py`: read certificate metadata; replace managed `/etc/agentd-web/tls.crt` + `tls.key` after PEM/match/expiry checks; preserves ownership/mode.
- `scripts/admin_configuration.py`: richer TLS metadata via `admin_tls.metadata`.
- Admin helper/client/runner/gateway/mobile: `admin-tls-replace` with step-up preview; helper request cap 64 KiB; longer helper/bridge timeouts for OpenSSL work.
- Settings > Configuration: TLS overview (subject/issuer/fingerprint/days) and replace form; gateway restart CTA afterward.
- Also fixes adapter/runtime apply confirmation to re-enter the access key (same pattern as service restart).

## Validation evidence

- Local: typecheck, format, `python3 -B test/admin_tls.py`, `test/admin_configuration.py`, request-routing/gateway tests.
- CI: Node 24/26 and Required Linux isolation passed on #81.
- Live: 220/220 install tests; services active; configuration TLS metadata returns fingerprint and expiry.

## Next steps

1. Next: approved native CLI binary helper (profile/hardening remain one-way migrations, already applied).
2. Full restore workflows remain after CLI helper.
