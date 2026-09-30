# 2026-09-30 — 0.125.0: Menu aria-expanded sync (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation ••• and agent picker summaries must keep `aria-expanded` in sync with open state
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.125.0
- Branch and base: `feat/gui-menu-expanded` on `main` (0.124.0)
- Implementation commit(s): 95d9bd8
- PR: #191

## Changes and relevant files

- Both menus start with `aria-expanded="false"` on their summaries.
- `setupShell` updates `aria-expanded` on `toggle`.
- Package 0.125.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #191; live-installed on 192.168.1.20 (0.125.0 / 85c5212).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.124.0 / revert of #191.

## Constraints and known issues

- Native details already expose open state; this keeps the summary attribute explicit.

## Next steps

1. Done: merged #191 and live-installed 0.125.0.
2. Continue UX polish or admin slices as operator priority allows.
