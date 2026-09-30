# 2026-09-30 — 0.153.0: Sidebar foot workspace tools landmark (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sidebar foot Activity/Settings region must expose a landmark name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.153.0
- Branch and base: `feat/gui-sidebar-foot-label` on `main` (0.152.0)
- Implementation commit(s): 6ff4914
- PR: #247

## Changes and relevant files

- `.sidebar-foot` is `role="navigation"` with `aria-label="Workspace tools"`.
- Package 0.153.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #247; live-installed on 192.168.1.20 (0.153.0 / 6ff4914).
- Archive SHA-256: `e0947b5d5cbb27ac6dbd64ccb1e76e97dc4c9725766fe44a65db9ccd82a43ed9`
- Revision: `6ff49146a231c50621ff799e30574a3866209c43`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.152.0 / revert of #247.

## Constraints and known issues

- Nested under the complementary sidebar; labeled distinctly from Projects/Conversations navs.

## Next steps

1. Done: merged #247 and live-installed 0.153.0.
2. Continue UX polish or admin slices as operator priority allows.
