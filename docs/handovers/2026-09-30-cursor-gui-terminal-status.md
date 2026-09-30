# 2026-09-30 — 0.92.0: Honest finished-status labels (UX-1 / U10)

- Author/agent: Cursor
- Requested outcome: Finished Ask/chat turns must not imply a review; pending and committed edits stay explicit
- Status: implemented
- Release: 0.92.0
- Branch and base: `feat/gui-terminal-status` on `main` (0.91.0)
- Implementation commit(s): (filled after commit)
- PR: (filled after open)

## Changes and relevant files

- `formatTerminalStatusLabel` in `public/ui.js` maps succeeded Ask/chat → “Answer ready”, pending edit review → “Changes ready for review”, committed → “Committed”.
- Conversation turn status uses it for non-pending statuses. Package 0.92.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Operations Center aggregate wording is unchanged in this slice.
- Failure/timeout labels still come from the shared labels map.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
