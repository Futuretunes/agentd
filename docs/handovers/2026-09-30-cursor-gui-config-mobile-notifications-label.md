# 2026-09-30 — 0.315.0: Mobile notifications accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration Mobile notifications section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.315.0
- Branch and base: `feat/gui-config-mobile-notifications-label` on `main` (0.314.0)
- Implementation commit(s): 64f0d3f
- PR: #571

## Changes and relevant files

- Configuration Mobile notifications section sets `aria-label="Mobile notifications"`.
- Package 0.315.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #571; live-installed on 192.168.1.20 (0.315.0 / 64f0d3fd90bad0b4de7abdc8ee1884934aaa24ba).
- Archive SHA-256: `6549e352502de3326d9606fc1abbe53cf94026324c8b068ae26d9ec2c938a9e6`
- Revision: `64f0d3fd90bad0b4de7abdc8ee1884934aaa24ba`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.314.0 / revert of #571.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #571 and live-installed 0.315.0.
2. Label Configuration GitHub connection next.
