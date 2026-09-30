# 2026-09-30 — 0.154.0: Polite live review and run content (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review changes and Run activity panels must announce content updates politely
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.154.0
- Branch and base: `feat/gui-review-live` on `main` (0.153.0)
- Implementation commit(s): 038063b
- PR: #249

## Changes and relevant files

- `#review-content` and `#run-content` set `aria-live="polite"`.
- Package 0.154.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #249; live-installed on 192.168.1.20 (0.154.0 / 038063b).
- Archive SHA-256: `05a68cb74a4e0327908a956842818f3bfb677af52802f4cdc5c75839380b920b`
- Revision: `038063be2d5c2b495d275e392270103c5811e088`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.153.0 / revert of #249.

## Constraints and known issues

- Complements Activity/history/attachments live regions.

## Next steps

1. Done: merged #249 and live-installed 0.154.0.
2. Continue UX polish or admin slices as operator priority allows.
