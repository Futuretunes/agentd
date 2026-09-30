# 2026-09-30 — 0.205.0: Review stats accessible name (UX-3 / U2)

- Author/agent: Cursor
- Requested outcome: Review change stats must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.205.0
- Branch and base: `feat/gui-review-stats-label` on `main` (0.204.0)
- Implementation commit(s): 64dda72
- PR: #351

## Changes and relevant files

- `#review-stats` sets `aria-label="Review change stats"`.
- Package 0.205.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #351; live-installed on 192.168.1.20 (0.205.0 / 64dda72).
- Archive SHA-256: `0636ecadce15a3398ab67177880c82aa0f5067a0cd9b65c34929f73e2b2097cc`
- Revision: `64dda72`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.204.0 / revert of #351.

## Constraints and known issues

- Complements polite live announcements on the same element (0.158.0).

## Next steps

1. Done: merged #351 and live-installed 0.205.0.
2. Label page notice toast next.
