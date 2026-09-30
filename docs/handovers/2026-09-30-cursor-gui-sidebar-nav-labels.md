# 2026-09-30 — 0.96.0: Sidebar project badge + accessible nav names (UX-5/U17, UX-4/U19)

- Author/agent: Cursor
- Requested outcome: Project sidebar must explain the numeric badge; project and conversation rows must expose accessible names
- Status: implemented
- Release: 0.96.0
- Branch and base: `feat/gui-sidebar-nav-labels` on `main` (0.95.0)
- Implementation commit(s): b44d366
- PR: (filled after open)

## Changes and relevant files

- `projectNavLabel` / `conversationNavLabel` in `public/ui.js`.
- Project rows show “N conversation(s)” instead of a bare number; both project and conversation buttons set `aria-label`.
- Package 0.96.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Visible badge text is longer than the prior digit; sidebar still ellipsizes the project title.
- Disclosure triangle styling and logo SVG remain later U17 items.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
