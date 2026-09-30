# 2026-09-30 — 0.81.0: signed-in HTTPS origin configuration

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Configuration can view/change the managed signed-in https origin
- Status: implemented; pending merge and live-install
- Release: 0.81.0
- Branch and base: `feat/gui-origin-config` on `main` (0.80.0)

## Changes and relevant files

- Helper mutates only `origin` in managed mobile JSON (https host + optional port; no path/credentials).
- `/api/origin` step-up preview/apply mirrors notifications.
- Configuration UI shows current origin and offers change + gateway restart CTA.
- Host/port bind editing remains out of scope.

## Validation evidence

- `node --test test/origin.test.mjs test/notifications.test.mjs test/request-routing.test.mjs`
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20; confirm origin display and that a change still requires gateway restart.
2. Remaining Configuration polish if any; otherwise UX backlog.
