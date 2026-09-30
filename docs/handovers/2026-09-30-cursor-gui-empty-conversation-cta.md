# 2026-09-30 — 0.108.0: Empty conversation CTA + title tooltips (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Empty conversation lists offer a clear start action; ellipsized project/conversation titles stay readable via title
- Status: implemented
- Release: 0.108.0
- Branch and base: `feat/gui-empty-conversation-cta` on `main` (0.107.0)
- Implementation commit(s): ec2e685
- PR: (filled after open)

## Changes and relevant files

- `emptyConversationList` builds copy + “＋ New conversation” wired to `#new`.
- `setTextWithTitle` sets `#project-name` / `#thread-title` text and matching `title`.
- Package 0.108.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Empty CTA reuses the sidebar New conversation control handler.
- Title attributes help mouse/hover and some AT; they are not a substitute for accessible names on buttons.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
