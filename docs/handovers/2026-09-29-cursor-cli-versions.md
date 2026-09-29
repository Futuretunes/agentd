# 2026-09-29 — 0.66.0: Agents & CLIs administration page

- Author/agent: Cursor (operator authorized continuous backlog; commits without review pauses)
- Requested outcome: next administration slice after 0.65.0 service restart
- Status: implemented; not installed
- Release: 0.66.0
- Branch and base: `feat/gui-cli-versions` on `feat/gui-service-restart`
- PR: (open after push)

## Changes and relevant files

- Settings gains **Agents & CLIs** with installed vs tested native versions from Operations data.
- Guided update steps mirror `docs/native-cli-updates.md`. Binary download/install from the phone remains deferred; Refresh re-probes versions via existing account refresh.
- `public/index.html`, `public/app.js`, `package.json` 0.66.0.

## Validation evidence

- Local typecheck/UI review pending with push CI. No new helper operations; read-only reuse of `/api/operations` and `/api/account` refresh.

## Deployment and rollback

- Not installed. No schema or helper migration. Ordinary application update only.

## Constraints and known issues

- Does not install or replace native CLI binaries. That remains an administrator host procedure until a narrowly scoped approved-binary helper exists.
- Impeccable design-hook warnings on Settings dialogs match the existing AgentD dialog/card patterns and were left standing.

## Next steps

1. Merge 0.64.x catch-up and 0.65.0 onto `main` if not already.
2. Review/merge this PR; stage when ready.
3. Next administration slice: GUI backups list/retention/restore preview.
