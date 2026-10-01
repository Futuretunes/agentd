# 2026-09-30 — 0.326.0: Execution details accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Approval execution Details disclosure exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.326.0
- Branch and base: `feat/gui-execution-details-label` on `main` (0.325.0)
- Implementation commit(s): fa3025e
- PR: #593

## Changes and relevant files

- Approval execution Details disclosure sets `aria-label="Execution details"`.
- Package 0.326.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #593; live-installed on 192.168.1.20 (0.326.0 / fa3025e29bbe89611d1934ff8e3cec69dcf2ceea).
- Archive SHA-256: `12647e0bcc540761d01fa405cbb889418586a761b59de3ff18987aa759f880bc`
- Revision: `fa3025e29bbe89611d1934ff8e3cec69dcf2ceea`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.325.0 / revert of #593.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #593 and live-installed 0.326.0.
2. Label publication commit disclosures next.
