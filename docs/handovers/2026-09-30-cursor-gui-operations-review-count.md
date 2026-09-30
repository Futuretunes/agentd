# 2026-09-30 — 0.93.0: Operations awaiting-review count (UX-1 / U10)

- Author/agent: Cursor
- Requested outcome: Operations must not count pending-review edits as Completed while also listing them as needing review
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.93.0
- Branch and base: `feat/gui-operations-review-count` on `main` (0.92.0)
- Implementation commit(s): d0d94e5
- PR: #127

## Changes and relevant files

- `operations` adds `review_pending` and `succeeded_complete` counts.
- Operations UI shows an “Awaiting review” metric and uses `succeeded_complete` for Completed.
- `operationsSummaryCounts` helper + unit test; projects operations fixture asserts the new fields.
- Package 0.93.0.

## Validation evidence

- CI green on #127; live-installed on 192.168.1.20 (0.93.0 / 5e7e40963bd8).

- `node --test test/ui.test.mjs test/projects.test.mjs` (operations-related)
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.92.0 / revert of #127.

## Constraints and known issues

- Queued metric still mirrors queueDepth; unchanged.
- Failed tasks that preserve a pending review are counted in both Awaiting review and Need attention when applicable — intentional dual signal.

## Next steps

1. Done: merged #127 and live-installed 0.93.0.
2. Continue UX polish or admin slices as operator priority allows.
