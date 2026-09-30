# 2026-09-30 — 0.86.0: Composer Stop/Cancel while active (UX-3 / U12)

- Author/agent: Cursor
- Requested outcome: Composer Send turns into an obvious Stop control while a run is active; cover waiting-for-approval Cancel and cancelling feedback without a new backend transport
- Status: implemented
- Release: 0.86.0
- Branch and base: `feat/gui-composer-stop` on `main` (0.85.0)
- Implementation commit(s): (filled after commit)
- PR: (filled after open)

## Changes and relevant files

- `composerStopControl` in `public/ui.js` decides composer Stop visibility/label/disabled for `queued`/`running` (■ Stop), `waiting_for_approval` (Cancel), and `cancelling` (Stopping… disabled).
- `public/app.js` refresh wiring uses that helper instead of only swapping Stop for queued/running.
- Existing `#stop-current` cancel API unchanged. Package 0.86.0; unit coverage in `test/ui.test.mjs`.
- Notes in ux-backlog / roadmap. Did not retouch 0.85 live docs.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Turn-level Run/Cancel buttons remain for approval; composer Cancel mirrors cancel for the latest pending turn.
- Review-pending lock still disables Send without showing Stop (no active process to stop).

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Remaining UX-3: change-review sheet polish as separately scoped work.
