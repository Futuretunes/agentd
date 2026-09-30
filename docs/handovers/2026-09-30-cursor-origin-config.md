# 2026-09-30 — 0.81.0: signed-in HTTPS origin configuration

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Configuration can view/change the managed signed-in https origin
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.81.0
- Branch and base: `feat/gui-origin-config` on `main` (0.80.0)
- PR: #101

## Changes and relevant files

- Helper mutates only `origin` in managed mobile JSON (https host + optional port; no path/credentials).
- `/api/origin` step-up preview/apply mirrors notifications.
- Configuration UI shows current origin and offers change + gateway restart CTA.
- Host/port bind editing remains out of scope.

## Validation evidence

- `node --test test/origin.test.mjs test/notifications.test.mjs test/request-routing.test.mjs`
- CI green on #101; live-installed on 192.168.1.20 (0.81.0 / 76f000b).

## Next steps

1. Confirm origin display on the live host; gateway restart still required after a change.
2. Remaining Configuration polish if any; otherwise UX backlog.
