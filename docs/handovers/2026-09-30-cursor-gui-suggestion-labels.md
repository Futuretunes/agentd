# 2026-09-30 — 0.122.0: Suggestion chip accessible names (UX-1 / U19)

- Author/agent: Cursor
- Requested outcome: Welcome suggestion chips must expose clear accessible names as a labeled group
- Status: implemented
- Release: 0.122.0
- Branch and base: `feat/gui-suggestion-labels` on `main` (0.121.0)
- Implementation commit(s): 538b43a
- PR: pending

## Changes and relevant files

- Welcome `.suggestions` is `role="group"` with `aria-label="Suggested prompts"`.
- Each chip sets `aria-label="Use suggestion: …"`.
- Package 0.122.0; source assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Visible chip text stays unchanged for sighted density.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
