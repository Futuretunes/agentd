# 2026-09-30 — 0.84.0: Elapsed time for active runs (UX-3)

- Author/agent: Cursor
- Requested outcome: Show honest elapsed time beside the conversation detail status label while a run is active; reuse existing poll/tick; no websockets or new backend fields
- Status: implemented
- Release: 0.84.0
- Branch and base: `feat/gui-run-elapsed` on `main` (0.83.1)
- Implementation commit(s): `7b0709bfa7aa77a270ee66c07671d6dc0353a249`
- PR: #109 — https://github.com/Futuretunes/agentd/pull/109

## Changes and relevant files

- Conversation turn status span shows compact elapsed for `waiting_for_approval`, `queued`, `running`, and `cancelling` (e.g. `Working · 1m 12s`, `Ready for your approval · waiting 45s`).
- Anchor is task `updated` (set on each status transition in the runner); `created` is fallback only. There is no unused `started_at` field.
- Existing 1s `setupShell` tick refreshes `[data-started]` labels between poll refreshes; decorative `.run-progress` pulse remains for running/queued/cancelling without duplicating the time.
- Pure helpers: `formatCompactDuration`, `formatActiveStatusLabel` in `public/ui.js`; wired from `public/app.js`.
- Unit coverage in `test/ui.test.mjs`. Package bumped to 0.84.0. Brief notes in `docs/design/ux-backlog.md` and `docs/roadmap.md`.
- Did not touch `docs/0.83.1-live`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only; do not merge/install from this handover. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Duration is time in the *current* status (since `updated`), not total wall time since task creation. Queued→running resets the clock when `running` begins — intentional and honest for “Working · …”.
- Terminal states keep prior labels without duration.

## Next steps

1. Merge when CI is green; do not install until operator asks.
2. Remaining UX-3: bounded current output / change-review guidance as separately scoped work.
