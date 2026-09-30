# 2026-09-30 — 0.257.0: Agent picker panel accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent mode/model picker panel exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.257.0
- Branch and base: `feat/gui-picker-panel-label` on `main` (0.256.0)
- Implementation commit(s): ed03b30
- PR: #455

## Changes and relevant files

- Agent `.picker-panel` sets `role="group"` and `aria-label="Agent mode and model"`.
- Package 0.257.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #455; live-installed on 192.168.1.20 (0.257.0 / ed03b30a25f7d0c4cf7c5e8d360c0adfe6775e40).
- Archive SHA-256: `7eb20bec1f7932df915cc3afbd2ae2a5098606d0a53f4a2a16574812f68b0532`
- Revision: `ed03b30a25f7d0c4cf7c5e8d360c0adfe6775e40`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.256.0 / revert of #455.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #455 and live-installed 0.257.0.
2. Label conversation list next.
