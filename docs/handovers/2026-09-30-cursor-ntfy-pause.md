# 2026-09-30 — 0.83.0: Pause ntfy delivery without clearing destination

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Configuration can pause/resume ntfy pushes while keeping the saved destination
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.83.0
- PR: #105
- Branch and base: `feat/gui-ntfy-pause` on `main` (0.82.0)

## Changes and relevant files

- `notifications.ntfy.paused: true` in managed `mobile.json` (omit/false when active).
- `notificationSettings` / view returns `paused`; `deliveryEnabled` is true only when configured and not paused.
- `applyNotificationSettings` accepts `{ paused: true|false }` beside set/clear; clear removes paused with the destination.
- Runner `notifyTaskStatus` skips when paused / `!deliveryEnabled`.
- Configuration UI shows Paused/Active and Pause/Resume step-up forms (mirror clear).
- Mobile `/api/notifications` preview/apply accepts paused settings (top-level or settings object).

## Validation evidence

- CI green on #105; live-installed on 192.168.1.20 (0.83.0 / 7ab6950).

- `node --test test/notifications.test.mjs`
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20; confirm pause keeps destination and skips pushes until resume.
2. Remaining UX backlog if any Configuration polish remains.
