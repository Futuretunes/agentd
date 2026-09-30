# 2026-09-30 — 0.233.0: New project name accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: New project name input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.233.0
- Branch and base: `feat/gui-project-input-label` on `main` (0.232.0)
- Implementation commit(s): 837b6a0
- PR: #407

## Changes and relevant files

- `#project-input` keeps visible Project name label and sets `aria-label="New project name"`.
- Package 0.233.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #407; live-installed on 192.168.1.20 (0.233.0 / 837b6a0e03420982d072fb2b885096e8d4e4ff6c).
- Archive SHA-256: `287fe2555d20d340107774c8b7bba452f0ae9aee66d7437e0f2a87ca23c74eba`
- Revision: `837b6a0e03420982d072fb2b885096e8d4e4ff6c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.232.0 / revert of #407.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #407 and live-installed 0.233.0.
2. Label conversation mode select next.
