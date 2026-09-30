# 2026-09-30 — 0.113.0: New conversation accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: New conversation controls expose a stable accessible name without relying on the ＋ glyph
- Status: implemented
- Release: 0.113.0
- Branch and base: `feat/gui-new-chat-label` on `main` (0.112.0)
- Implementation commit(s): 384f1d2
- PR: (filled after open)

## Changes and relevant files

- `#new` sets `aria-label="New conversation"`.
- Empty-list CTA from `emptyConversationList` matches that label.
- Package 0.113.0; HTML/unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Visible label still includes ＋ for sighted users; AT uses the aria-label.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
