# 2026-09-30 — 0.344.0: Delete access-key recovery form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Delete access-key recovery form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.344.0
- Implementation commit(s): 6d9ed6b
- PR: #628

## Changes and relevant files

- See feature PR #628.
- Package 0.344.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #628; live-installed on 192.168.1.20 (0.344.0 / 6d9ed6bd772a05ead52cdaa0f97e0b2a772c66a3).
- Archive SHA-256: `b4650acd56d214e8e2523e61210f31a551c12a1d0ed420b9b97acfdca289b776`
- Revision: `6d9ed6bd772a05ead52cdaa0f97e0b2a772c66a3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #628.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #628 and live-installed 0.344.0.
2. Label CLI install approval form next.
