# 2026-09-30 — 0.232.0: Import project name accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Import project name input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.232.0
- Branch and base: `feat/gui-repository-name-label` on `main` (0.231.0)
- Implementation commit(s): fbc10ce
- PR: #405

## Changes and relevant files

- `#repository-name` keeps visible Project name label and sets `aria-label="Import project name"`.
- Package 0.232.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #405; live-installed on 192.168.1.20 (0.232.0 / fbc10ce9af433cec4dcfe0868a02a16cc1f5e5cd).
- Archive SHA-256: `4f2440a0d17fac136255c3b5b83ceb287f58566f7e5d3c74d9ee2883ab0494aa`
- Revision: `fbc10ce9af433cec4dcfe0868a02a16cc1f5e5cd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.231.0 / revert of #405.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #405 and live-installed 0.232.0.
2. Label new-project name input next.
