# 2026-09-30 — 0.190.0: Phone composer horizontal safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone message composer must clear left and right safe-area insets
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.190.0
- Branch and base: `feat/gui-composer-safe-area-x` on `main` (0.189.0)
- Implementation commit(s): cad8e5f
- PR: #321

## Changes and relevant files

- Phone `.composer-wrap` sets horizontal padding with `max(12px, env(safe-area-inset-left|right))`.
- Package 0.190.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #321; live-installed on 192.168.1.20 (0.190.0 / cad8e5f).
- Archive SHA-256: `2ad2c0f8481925d84fc7189b6ef3f743013bd4ad58843c71ec80523dd3cbc88b`
- Revision: `cad8e5f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.189.0 / revert of #321.

## Constraints and known issues

- Complements conversation `#detail` horizontal safe-area (0.189.0).

## Next steps

1. Done: merged #321 and live-installed 0.190.0.
2. Continue phone dialog / header horizontal safe-area polish.
