# 2026-09-30 — 0.108.0: Empty conversation CTA + title tooltips (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Empty conversation lists offer a clear start action; ellipsized project/conversation titles stay readable via title
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.108.0
- Branch and base: `feat/gui-empty-conversation-cta` on `main` (0.107.0)
- Implementation commit(s): ec2e685
- PR: #157

## Changes and relevant files

- `emptyConversationList` builds copy + “＋ New conversation” wired to `#new`.
- `setTextWithTitle` sets `#project-name` / `#thread-title` text and matching `title`.
- Package 0.108.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #157; live-installed on 192.168.1.20 (0.108.0 / 701f1aa).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.107.0 / revert of #157.

## Constraints and known issues

- Empty CTA reuses the sidebar New conversation control handler.
- Title attributes help mouse/hover and some AT; they are not a substitute for accessible names on buttons.

## Next steps

1. Done: merged #157 and live-installed 0.108.0.
2. Continue UX polish or admin slices as operator priority allows.
