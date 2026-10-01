# 2026-09-30 — 0.327.0: Publication commit disclosure accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication commit disclosures expose stable accessible names from their short SHA
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.327.0
- Branch and base: `feat/gui-publication-commit-details-label` on `main` (0.326.0)
- Implementation commit(s): 5d687fa
- PR: #595

## Changes and relevant files

- Each publication commit disclosure sets `aria-label` from `Publication commit` + short SHA.
- Package 0.327.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #595; live-installed on 192.168.1.20 (0.327.0 / 5d687fa4133a76a61edb310d4b2f0a02dd846e3b).
- Archive SHA-256: `341baa0de00e16c300bcfa746a926ab5163f6f2c32f3048231d7b9d35373129d`
- Revision: `5d687fa4133a76a61edb310d4b2f0a02dd846e3b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.326.0 / revert of #595.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #595 and live-installed 0.327.0.
2. Label Set signed-in origin form section next.
