# 2026-09-30 — 0.258.0: Sidebar brand header accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sidebar brand header exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.258.0
- Branch and base: `feat/gui-sidebar-head-label` on `main` (0.257.0)
- Implementation commit(s): e08440f
- PR: #457

## Changes and relevant files

- Sidebar `.sidebar-head` sets `role="group"` and `aria-label="Workspace brand"`.
- Package 0.258.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #457; live-installed on 192.168.1.20 (0.258.0 / e08440f9a7b54d68c8037bb0f709d846fb06e4f3).
- Archive SHA-256: `38e0739223149c91c73e4afa1e5f1ed73476202d391b980b93ea341b69e386fc`
- Revision: `e08440f9a7b54d68c8037bb0f709d846fb06e4f3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.257.0 / revert of #457.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #457 and live-installed 0.258.0.
2. Label image attachment wrap next.
