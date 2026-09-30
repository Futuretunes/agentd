# 2026-09-30 — 0.274.0: Access key dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Access key dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.274.0
- Branch and base: `feat/gui-access-key-head-label` on `main` (0.273.0)
- Implementation commit(s): daac634
- PR: #489

## Changes and relevant files

- Access key dialog `.review-head` sets `role="group"` and `aria-label="Access key heading"`.
- Package 0.274.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #489; live-installed on 192.168.1.20 (0.274.0 / daac634b7c40113ed4a6e63a67278def9fb5c813).
- Archive SHA-256: `66459639e95256d312288207e11b12efa7f672e1984d74df49c91847906bdd93`
- Revision: `daac634b7c40113ed4a6e63a67278def9fb5c813`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.273.0 / revert of #489.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #489 and live-installed 0.274.0.
2. Label updates dialog heading next.
