# 2026-09-30 — 0.78.0: Configure ntfy destination

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Configuration can save/clear an https ntfy server + topic
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.78.0
- Branch and base: `feat/gui-ntfy-config` on `main` (0.77.0)
- PR: #95

## Changes and relevant files

- Helper mutates `notifications.ntfy` in the managed mobile JSON (no credentials in URL).
- Settings > Configuration shows destination status and step-up set/clear forms.
- `deliveryEnabled` remains false; push delivery is a follow-up slice.

## Validation evidence

- `node --test test/notifications.test.mjs`
- CI green on #95; live-installed on 192.168.1.20.

## Next steps

1. Next: deliver approval/completion/failure ntfy pushes with authenticated links and duplicate prevention.
