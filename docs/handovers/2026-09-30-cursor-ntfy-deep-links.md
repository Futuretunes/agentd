# 2026-09-30 — 0.80.0: ntfy authenticated deep links + durable dedupe

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: click opens the relevant signed-in work; restart does not re-notify the same task+status
- Status: implemented; pending merge and live-install
- Release: 0.80.0
- Branch and base: `feat/gui-ntfy-deep-links` on `main` (0.79.0)

## Changes and relevant files

- `src/notifications.ts`: `taskNotificationClick`, load/save/trim for `notifications-sent.json`.
- `src/runner.ts`: builds deep-link click URLs; persists notified keys under stateDir (fail-open read; remove key on publish failure).
- `public/app.js`: honors `?project=&conversation=` (and strips search) over sessionStorage location.
- No access keys, session tokens, or magic auth tokens in click URLs — browser session cookie after sign-in.

## Validation evidence

- `node --test test/notifications-delivery.test.mjs test/notifications.test.mjs`
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20; click an approval push and confirm the correct conversation opens.
2. Remaining Configuration polish / other backlog items.
