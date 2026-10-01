# 2026-09-30 — 0.314.0: Signed-in origin accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration Signed-in origin section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.314.0
- Branch and base: `feat/gui-config-signed-in-origin-label` on `main` (0.313.0)
- Implementation commit(s): fcf0176
- PR: #569

## Changes and relevant files

- Configuration Signed-in origin section sets `aria-label="Signed-in origin"`.
- Package 0.314.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #569; live-installed on 192.168.1.20 (0.314.0 / fcf01766abd17120a56d212c9f95e97e0bf58627).
- Archive SHA-256: `9e539e9d4ceeb6bb8dabd4eab052a403ae201c945da32472cf968f74630edfb1`
- Revision: `fcf01766abd17120a56d212c9f95e97e0bf58627`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.313.0 / revert of #569.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #569 and live-installed 0.314.0.
2. Label Mobile notifications next.
