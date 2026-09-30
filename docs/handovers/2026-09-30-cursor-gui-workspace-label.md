# 2026-09-30 — 0.132.0: Workspace accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: The signed-in workspace shell must expose a stable accessible name
- Status: implemented
- Release: 0.132.0
- Branch and base: `feat/gui-workspace-label` on `main` (0.131.0)
- Implementation commit(s): 1edd975
- PR: #205

## Changes and relevant files

- `#workspace` sets `aria-label="agentd workspace"`.
- Package 0.132.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Nested landmarks (sidebar/main) remain the primary navigation structure.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
