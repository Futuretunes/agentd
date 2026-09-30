# 2026-09-30 — 0.210.0: Phone dialog top safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone dialog sheets must clear the top safe-area inset
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.210.0
- Branch and base: `feat/gui-dialog-top-safe-area` on `main` (0.209.0)
- Implementation commit(s): 6e2f9bf
- PR: #361

## Changes and relevant files

- Phone `dialog` padding top uses `max(20px, env(safe-area-inset-top))`.
- Package 0.210.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #361; live-installed on 192.168.1.20 (0.210.0 / 6e2f9bf).
- Archive SHA-256: `a20b3324d6a65afde72c30d4e94322b04bb29704d703bcf066a2661a9cf10d28`
- Revision: `6e2f9bf`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.209.0 / revert of #361.

## Constraints and known issues

- Complements horizontal dialog safe-area from 0.191.0.

## Next steps

1. Done: merged #361 and live-installed 0.210.0.
2. Clear skip-link safe-area next.
