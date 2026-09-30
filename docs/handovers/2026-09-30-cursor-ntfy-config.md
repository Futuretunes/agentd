# 2026-09-30 — 0.78.0: Configure ntfy destination

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Configuration can save/clear an https ntfy server + topic
- Status: implemented; pending merge and live-install
- Release: 0.78.0
- Branch and base: `feat/gui-ntfy-config` on `main` (0.77.0)

## Changes and relevant files

- Helper mutates `notifications.ntfy` in the managed mobile JSON (no credentials in URL).
- Settings > Configuration shows destination status and step-up set/clear forms.
- `deliveryEnabled` remains false; push delivery is a follow-up slice.

## Validation evidence

- `node --test test/notifications.test.mjs`
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Next: deliver approval/completion/failure ntfy pushes with authenticated links and duplicate prevention.
