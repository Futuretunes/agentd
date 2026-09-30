# 2026-09-30 — 0.92.0: Honest finished-status labels (UX-1 / U10)

- Author/agent: Cursor
- Requested outcome: Finished Ask/chat turns must not imply a review; pending and committed edits stay explicit
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.92.0
- Branch and base: `feat/gui-terminal-status` on `main` (0.91.0)
- Implementation commit(s): eb922db
- PR: #125

## Changes and relevant files

- `formatTerminalStatusLabel` in `public/ui.js` maps succeeded Ask/chat → “Answer ready”, pending edit review → “Changes ready for review”, committed → “Committed”.
- Conversation turn status uses it for non-pending statuses. Package 0.92.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #125; live-installed on 192.168.1.20 (0.92.0 / 43041c490b7c).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.91.0 / revert of #125.

## Constraints and known issues

- Operations Center aggregate wording is unchanged in this slice.
- Failure/timeout labels still come from the shared labels map.

## Next steps

1. Done: merged #125 and live-installed 0.92.0.
2. Continue UX polish or admin slices as operator priority allows.
