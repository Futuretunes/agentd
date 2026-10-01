# 2026-09-30 — 0.318.0: Diagnostics services accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics Services section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.318.0
- Branch and base: `feat/gui-diagnostics-services-label` on `main` (0.317.0)
- Implementation commit(s): 9579180
- PR: #577

## Changes and relevant files

- Diagnostics Services section sets `aria-label="Diagnostics services"`.
- Package 0.318.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #577; live-installed on 192.168.1.20 (0.318.0 / 9579180c26f4335ff113553eae7b7d30ff063ec4).
- Archive SHA-256: `76bf787ac2fe0be89d253a27f8df6052d029e2302f95de12c4b0be3658b71cf5`
- Revision: `9579180c26f4335ff113553eae7b7d30ff063ec4`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.317.0 / revert of #577.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #577 and live-installed 0.318.0.
2. Label Restart services next.
