# 2026-09-30 — 0.223.0: Repository branch accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Repository branch select exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.223.0
- Branch and base: `feat/gui-repository-branch-label` on `main` (0.222.0)
- Implementation commit(s): cf04400
- PR: #387

## Changes and relevant files

- `#repository-branch` keeps visible Branch label and sets `aria-label="Repository branch"`.
- Package 0.223.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #387; live-installed on 192.168.1.20 (0.223.0 / cf04400b612dce521d3cc739a6a7f8e3ff4b42b7).
- Archive SHA-256: `1cc51199e813751b2763fef37239b7f97d72db5df14fee3ad8d705457d275cd2`
- Revision: `cf04400b612dce521d3cc739a6a7f8e3ff4b42b7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.222.0 / revert of #387.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #387 and live-installed 0.223.0.
2. Continue select aria-label polish for publishing targets.
