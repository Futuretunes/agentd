# 2026-09-30 — 0.306.0: Review checks accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review checks section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.306.0
- Branch and base: `feat/gui-review-checks-label` on `main` (0.305.0)
- Implementation commit(s): 2f9a27b
- PR: #553

## Changes and relevant files

- Review `review-checks` sets `aria-label="Review checks"`.
- Package 0.306.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #553; live-installed on 192.168.1.20 (0.306.0 / 2f9a27bedd12cc74e2068b4c129869e3f767dfe2).
- Archive SHA-256: `9ec6efbf153ef20c1a19cde239a68abf516c02453b98bdcbf126110bde77c7a1`
- Revision: `2f9a27bedd12cc74e2068b4c129869e3f767dfe2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.305.0 / revert of #553.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #553 and live-installed 0.306.0.
2. Label large review files next.
