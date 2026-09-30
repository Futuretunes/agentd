# 2026-09-30 — 0.279.0: Diagnostics dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.279.0
- Branch and base: `feat/gui-diagnostics-head-label` on `main` (0.278.0)
- Implementation commit(s): b970844
- PR: #499

## Changes and relevant files

- Diagnostics dialog `.review-head` sets `role="group"` and `aria-label="Diagnostics heading"`.
- Package 0.279.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #499; live-installed on 192.168.1.20 (0.279.0 / b970844cbe085b56faf8681ca93f8871da48d7cf).
- Archive SHA-256: `23221c3ebb86637bca98e48f05362f255184593cb7a4008abed01e86287a3ab5`
- Revision: `b970844cbe085b56faf8681ca93f8871da48d7cf`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.278.0 / revert of #499.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #499 and live-installed 0.279.0.
2. Label New project dialog heading next.
