# 2026-09-30 — 0.337.0: Configuration service restart form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration service restart form exposes a stable accessible name from the service name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.337.0
- Branch and base: `feat/gui-configuration-restart-form-label` on `main` (0.336.0)
- Implementation commit(s): 25c6ef3
- PR: #615

## Changes and relevant files

- Configuration service restart form sets `aria-label="Configuration restart " + label`.
- Package 0.337.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #615; live-installed on 192.168.1.20 (0.337.0 / 25c6ef3c0e2ba70b42a8f5f2549964548241221d).
- Archive SHA-256: `85787d3472f4d8061f9847a8ed0f0429bd34ed7a803a1d09a244ae97bb2b8c8b`
- Revision: `25c6ef3c0e2ba70b42a8f5f2549964548241221d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.336.0 / revert of #615.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #615 and live-installed 0.337.0.
2. Label Backup cleanup form next.
