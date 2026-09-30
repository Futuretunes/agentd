# 2026-09-30 — 0.79.0: ntfy approval and completion delivery

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: push ntfy alerts for approval waits and terminal run statuses
- Status: implemented; pending merge and live-install
- Release: 0.79.0
- Branch and base: `feat/gui-ntfy-delivery` on `main` (0.78.0)

## Changes and relevant files

- `src/notifications.ts`: bounded ntfy JSON publish helper and status copy.
- `src/runner.ts`: best-effort notify on `waiting_for_approval`, `succeeded`, `failed`, `timed_out`, `interrupted`.
- Configuration UI reflects that delivery is enabled when a destination is saved.
- Authenticated deep links remain a follow-up; click opens the configured origin.

## Validation evidence

- `node --test test/notifications-delivery.test.mjs test/notifications.test.mjs`
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20; configure a topic and exercise one approval wait.
2. Next: authenticated task deep links / duplicate persistence across restarts.
