# 2026-09-30 — 0.310.0: TLS certificate accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration TLS certificate section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.310.0
- Branch and base: `feat/gui-config-tls-label` on `main` (0.309.0)
- Implementation commit(s): 7ff31d3
- PR: #561

## Changes and relevant files

- Configuration TLS certificate section sets `aria-label="TLS certificate"`.
- Package 0.310.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #561; live-installed on 192.168.1.20 (0.310.0 / 7ff31d3ff36b60c8cf67ccde8adc8c1107b0288f).
- Archive SHA-256: `20371b0ef88f5d98e8938316edf25f4825549a0560caf4cfb33c82eceaee34e3`
- Revision: `7ff31d3ff36b60c8cf67ccde8adc8c1107b0288f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.309.0 / revert of #561.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #561 and live-installed 0.310.0.
2. Label Agent adapters section next.
