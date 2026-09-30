# 2026-09-30 — 0.107.0: Skip link to conversation (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Keyboard users can jump past navigation into the conversation region
- Status: implemented
- Release: 0.107.0
- Branch and base: `feat/gui-skip-link` on `main` (0.106.0)
- Implementation commit(s): 25c730f
- PR: (filled after open)

## Changes and relevant files

- Workspace exposes a focus-revealed “Skip to conversation” link targeting `#detail`.
- Conversation region is focusable (`tabindex="-1"`) so the skip destination receives focus.
- Package 0.107.0; HTML/CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Skip link is inside `#workspace` (hidden until signed in).
- Mouse users never see it unless they tab.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
