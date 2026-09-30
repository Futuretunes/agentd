# 2026-09-30 — 0.79.0: ntfy approval and completion delivery

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: push ntfy alerts for approval waits and terminal run statuses
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.79.0
- Branch and base: `feat/gui-ntfy-delivery` on `main` (0.78.0)
- PR: #97

## Changes and relevant files

- `src/notifications.ts`: bounded ntfy JSON publish helper and status copy.
- `src/runner.ts`: best-effort notify on `waiting_for_approval`, `succeeded`, `failed`, `timed_out`, `interrupted`.
- Configuration UI reflects that delivery is enabled when a destination is saved.
- Authenticated deep links and durable dedupe follow in 0.80.0; click opened the configured origin only.

## Validation evidence

- `node --test test/notifications-delivery.test.mjs test/notifications.test.mjs`
- CI green on #97; live-installed on 192.168.1.20 (0.79.0 / 037545fd9e30).

## Next steps

1. Done for delivery scope; see [0.80.0 deep links handover](2026-09-30-cursor-ntfy-deep-links.md).
