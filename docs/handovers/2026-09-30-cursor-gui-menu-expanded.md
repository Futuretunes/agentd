# 2026-09-30 — 0.125.0: Menu aria-expanded sync (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation ••• and agent picker summaries must keep `aria-expanded` in sync with open state
- Status: implemented
- Release: 0.125.0
- Branch and base: `feat/gui-menu-expanded` on `main` (0.124.0)
- Implementation commit(s): 2319b71
- PR: #191

## Changes and relevant files

- Both menus start with `aria-expanded="false"` on their summaries.
- `setupShell` updates `aria-expanded` on `toggle`.
- Package 0.125.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Native details already expose open state; this keeps the summary attribute explicit.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
