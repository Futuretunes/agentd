# 2026-09-30 — 0.86.0: Composer Stop/Cancel while active (UX-3 / U12)

- Author/agent: Cursor
- Requested outcome: Composer Send turns into an obvious Stop control while a run is active; cover waiting-for-approval Cancel and cancelling feedback without a new backend transport
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.86.0
- Branch and base: `feat/gui-composer-stop` on `main` (0.85.0)
- Implementation commit(s): b9d2821
- PR: #113

## Changes and relevant files

- `composerStopControl` in `public/ui.js` decides composer Stop visibility/label/disabled for `queued`/`running` (■ Stop), `waiting_for_approval` (Cancel), and `cancelling` (Stopping… disabled).
- `public/app.js` refresh wiring uses that helper instead of only swapping Stop for queued/running.
- Existing `#stop-current` cancel API unchanged. Package 0.86.0; unit coverage in `test/ui.test.mjs`.
- Notes in ux-backlog / roadmap. Did not retouch 0.85 live docs.

## Validation evidence

- CI green on #113; live-installed on 192.168.1.20 (0.86.0 / c6b4f2e457fb).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.85.0 / revert of #113.

## Constraints and known issues

- Turn-level Run/Cancel buttons remain for approval; composer Cancel mirrors cancel for the latest pending turn.
- Review-pending lock still disables Send without showing Stop (no active process to stop).

## Next steps

1. Done: merged #113 and live-installed 0.86.0.
2. Remaining UX-3: change-review sheet polish as separately scoped work.
