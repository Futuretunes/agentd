# 2026-09-30 — 0.158.0: Polite live review stats (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review changes summary line must announce updates politely
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.158.0
- Branch and base: `feat/gui-review-stats-live` on `main` (0.157.0)
- Implementation commit(s): e86b57f
- PR: #257

## Changes and relevant files

- `#review-stats` sets `aria-live="polite"`.
- Package 0.158.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #257; live-installed on 192.168.1.20 (0.158.0 / e86b57f).
- Archive SHA-256: `5d4b36393e6953bd902384c14440e43a5aa6c9313323e262f5d4eea58340b769`
- Revision: `e86b57f902df5e9489aded1e5ede06779b9cbd6c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.157.0 / revert of #257.

## Constraints and known issues

- Complements review-content live region (0.154.0).

## Next steps

1. Done: merged #257 and live-installed 0.158.0.
2. Continue UX polish or admin slices as operator priority allows.
