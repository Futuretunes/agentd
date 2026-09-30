# 2026-09-30 — 0.184.0: Reviewed changes content accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review changes dialog content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.184.0
- Branch and base: `feat/gui-review-content-label` on `main` (0.183.0)
- Implementation commit(s): 0e67dae
- PR: #309

## Changes and relevant files

- `#review-content` aria-label "Reviewed changes" (keeps aria-live polite).
- Package 0.184.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #309; live-installed on 192.168.1.20 (0.184.0 / 0e67dae).
- Archive SHA-256: `ead066a632431415664366615fa1c6697ded57913aa194b7c68936cbcfea731b`
- Revision: `0e67dae`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.183.0 / revert of #309.

## Constraints and known issues

- Complements review stats live region and Review next steps label.

## Next steps

1. Done: merged #309 and live-installed 0.184.0.
2. Continue UX polish or admin slices as operator priority allows.
