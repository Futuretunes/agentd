# 2026-09-30 — 0.255.0: Composer actions group accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer actions group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.255.0
- Branch and base: `feat/gui-compose-foot-label` on `main` (0.254.0)
- Implementation commit(s): 7f72953
- PR: #451

## Changes and relevant files

- `.compose-foot` sets `role="group"` and `aria-label="Composer actions"`.
- Package 0.255.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #451; live-installed on 192.168.1.20 (0.255.0 / a6e98756325b8bc1db01fde1af0942587181b896).
- Archive SHA-256: `8432ba3e1fa3b74a4c72476955ab14d4e10dfed602e35336736537c48c773d9e`
- Revision: `a6e98756325b8bc1db01fde1af0942587181b896`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.254.0 / revert of #451.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #451 and live-installed 0.255.0.
2. Label conversation menu panel next.
