# 2026-09-30 — 0.267.0: Project settings dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Project settings dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.267.0
- Branch and base: `feat/gui-project-settings-head-label` on `main` (0.266.0)
- Implementation commit(s): a921fd5
- PR: #475

## Changes and relevant files

- Project settings dialog `.review-head` sets `role="group"` and `aria-label="Project settings heading"`.
- Package 0.267.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #475; live-installed on 192.168.1.20 (0.267.0 / a921fd583a35a247a4e1ad286e4fbd11b8755326).
- Archive SHA-256: `22222f4b1747c887d0ed26e26239a8cadc9a4c2442644d5762ae8e3589ca98e4`
- Revision: `a921fd583a35a247a4e1ad286e4fbd11b8755326`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.266.0 / revert of #475.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #475 and live-installed 0.267.0.
2. Label GitHub connection dialog heading next.
