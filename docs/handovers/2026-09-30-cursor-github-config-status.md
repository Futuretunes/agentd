# 2026-09-30 — 0.82.0: GitHub connection status in Configuration

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Configuration shows read-only GitHub connection status inline
- Status: implemented; pending merge and live-install
- Release: 0.82.0
- Branch and base: `feat/gui-github-config-status` on `main` (0.81.0)

## Changes and relevant files

- `public/app.js` `renderConfigurationSettings` fetches `/api/github` with other overview calls.
- New “GitHub connection” section: connected/not, AgentD access ceiling label when present, note that connect/reconnect/ceiling changes happen in GitHub settings; keeps “Open GitHub settings”.
- No new connect/disconnect or ceiling mutation flows in Configuration.

## Validation evidence

- Relies on existing `/api/github` coverage; no Configuration UI test pattern to extend.
- typecheck / format (run with commit)

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20; confirm Configuration shows connection status and deep-links to GitHub settings.
2. Remaining UX backlog if any Configuration polish remains.
