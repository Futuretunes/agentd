# 2026-09-30 — 0.144.0: Polite live model/effort selection summary (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Model/effort selection summary must announce without requiring focus
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.144.0
- Branch and base: `feat/gui-selection-summary-live` on `main` (0.143.0)
- Implementation commit(s): b5eb914
- PR: #229

## Changes and relevant files

- `#selection-summary` sets `aria-live="polite"`.
- Package 0.144.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #229; live-installed on 192.168.1.20 (0.144.0 / b5eb914).
- Archive SHA-256: `45ea9f1b5d183f0621cd0b5593610b4136f7d540ca62ebc1134685f7e51d5c79`
- Revision: `b5eb914969097b816c66c1758fcba8091e81548c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.143.0 / revert of #229.

## Constraints and known issues

- Complements agent-reasons and composer hint live regions.

## Next steps

1. Done: merged #229 and live-installed 0.144.0.
2. Continue UX polish or admin slices as operator priority allows.
