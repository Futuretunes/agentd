# 2026-09-30 — 0.90.0: Suggestion chip fill + focus (UX-1 / U15)

- Author/agent: Cursor
- Requested outcome: Suggestion chips give visible feedback (fill + focus + caret at end) without auto-submitting
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.90.0
- Branch and base: `feat/gui-suggestion-focus` on `main` (0.89.0)
- Implementation commit(s): 8d91a4f
- PR: #121

## Changes and relevant files

- `applySuggestionPrompt` in `public/ui.js` sets the value, parks the caret at the end, and returns hint copy.
- Empty-state suggestion buttons use it, save the draft, focus `#prompt`, and surface the hint on `#draft-hint`.
- Still does not auto-send. Package 0.90.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #121; live-installed on 192.168.1.20 (0.90.0 / 3c2402ee2d84).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.89.0 / revert of #121.

## Constraints and known issues

- Hint is overwritten by later draft-hint updates on ordinary typing; that is intentional.
- Dictate honesty remains separate if a Dictate control reappears.

## Next steps

1. Done: merged #121 and live-installed 0.90.0.
2. Remaining UX: post-commit publish primary step as separately scoped work.
