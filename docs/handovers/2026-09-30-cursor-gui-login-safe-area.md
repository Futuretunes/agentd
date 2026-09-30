# 2026-09-30 — 0.149.0: Phone login safe-area insets (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Sign-in page must clear notch and home-indicator safe areas on phones
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.149.0
- Branch and base: `feat/gui-login-safe-area` on `main` (0.148.0)
- Implementation commit(s): 1badf61
- PR: #239

## Changes and relevant files

- Phone `.login` padding/margin use `env(safe-area-inset-*)`.
- Package 0.149.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #239; live-installed on 192.168.1.20 (0.149.0 / 1badf61).
- Archive SHA-256: `9e498e272cb450d8d3c536cf7c26142854c0e0bc9432ef4530cef1b2465e41b0`
- Revision: `1badf61e7e3bea69106cc158cafc699282204cbb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.148.0 / revert of #239.

## Constraints and known issues

- Complements drawer/header/composer/review safe-area work.

## Next steps

1. Done: merged #239 and live-installed 0.149.0.
2. Continue UX polish or admin slices as operator priority allows.
