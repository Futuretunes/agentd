# 2026-09-30 — 0.128.0: Phone header safe-area (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Phone conversation header must clear the status bar / notch
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.128.0
- Branch and base: `feat/gui-header-safe-area` on `main` (0.127.0)
- Implementation commit(s): cccde81
- PR: #197

## Changes and relevant files

- Phone `header` padding-top uses `max(12px, env(safe-area-inset-top))`.
- Package 0.128.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #197; live-installed on 192.168.1.20 (0.128.0 / c031113).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.127.0 / revert of #197.

## Constraints and known issues

- Desktop header padding unchanged.

## Next steps

1. Done: merged #197 and live-installed 0.128.0.
2. Continue UX polish or admin slices as operator priority allows.
