# 2026-09-30 — 0.90.0: Suggestion chip fill + focus (UX-1 / U15)

- Author/agent: Cursor
- Requested outcome: Suggestion chips give visible feedback (fill + focus + caret at end) without auto-submitting
- Status: implemented
- Release: 0.90.0
- Branch and base: `feat/gui-suggestion-focus` on `main` (0.89.0)
- Implementation commit(s): (filled after commit)
- PR: (filled after open)

## Changes and relevant files

- `applySuggestionPrompt` in `public/ui.js` sets the value, parks the caret at the end, and returns hint copy.
- Empty-state suggestion buttons use it, save the draft, focus `#prompt`, and surface the hint on `#draft-hint`.
- Still does not auto-send. Package 0.90.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Hint is overwritten by later draft-hint updates on ordinary typing; that is intentional.
- Dictate honesty remains separate if a Dictate control reappears.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Remaining UX polish / admin slices as operator priority allows.
