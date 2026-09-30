# 2026-09-30 — 0.82.0: GitHub connection status in Configuration

- Author/agent: Cursor (operator authorized continuous backlog commits)
- Requested outcome: Settings > Configuration shows read-only GitHub connection status inline
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.82.0
- Branch and base: `feat/gui-github-config-status` on `main` (0.81.0)
- PR: #103

## Changes and relevant files

- `public/app.js` `renderConfigurationSettings` fetches `/api/github` with other overview calls.
- New “GitHub connection” section: connected/not, AgentD access ceiling label when present, note that connect/reconnect/ceiling changes happen in GitHub settings; keeps “Open GitHub settings”.
- No new connect/disconnect or ceiling mutation flows in Configuration.

## Validation evidence

- Relies on existing `/api/github` coverage; no Configuration UI test pattern to extend.
- CI green on #103; live-installed on 192.168.1.20 (0.82.0 / f8567c5d10f5).

## Next steps

1. Confirm Configuration shows connection status on the live host.
2. Remaining UX backlog; Configuration admin surface is largely complete.
