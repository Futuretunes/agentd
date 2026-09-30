# 2026-09-30 — 0.189.0: Phone conversation horizontal safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone conversation region must clear left and right safe-area insets
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.189.0
- Branch and base: `feat/gui-detail-safe-area-x` on `main` (0.188.0)
- Implementation commit(s): c2f24a4
- PR: #319

## Changes and relevant files

- Phone `#detail` sets horizontal padding with `max(16px, env(safe-area-inset-left|right))`.
- Package 0.189.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #319; live-installed on 192.168.1.20 (0.189.0 / f5c0b0d).
- Archive SHA-256: `3e5a875ddfab86d85230474e219dc7653b94f3d1964a8ddcb1b6a15894e166ca`
- Revision: `f5c0b0d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.188.0 / revert of #319.

## Constraints and known issues

- Complements drawer left safe-area (0.188.0) and existing top/bottom insets.

## Next steps

1. Done: merged #319 and live-installed 0.189.0.
2. Continue phone composer / dialog horizontal safe-area polish.
