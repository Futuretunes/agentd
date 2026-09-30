# 2026-09-30 — 0.113.0: New conversation accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: New conversation controls expose a stable accessible name without relying on the ＋ glyph
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.113.0
- Branch and base: `feat/gui-new-chat-label` on `main` (0.112.0)
- Implementation commit(s): 384f1d2
- PR: #167

## Changes and relevant files

- `#new` sets `aria-label="New conversation"`.
- Empty-list CTA from `emptyConversationList` matches that label.
- Package 0.113.0; HTML/unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #167; live-installed on 192.168.1.20 (0.113.0 / 61bc07f).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.112.0 / revert of #167.

## Constraints and known issues

- Visible label still includes ＋ for sighted users; AT uses the aria-label.

## Next steps

1. Done: merged #167 and live-installed 0.113.0.
2. Continue UX polish or admin slices as operator priority allows.
