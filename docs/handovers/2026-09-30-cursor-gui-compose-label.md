# 2026-09-30 — 0.127.0: Compose form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer form must expose a stable accessible name and point at the hint regions
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.127.0
- Branch and base: `feat/gui-compose-label` on `main` (0.126.0)
- Implementation commit(s): 4c44425
- PR: #195

## Changes and relevant files

- `#compose` sets `aria-label="Compose message"` and `aria-describedby` for hint / policy / draft hints.
- Package 0.127.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #195; live-installed on 192.168.1.20 (0.127.0 / a0c3415).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.126.0 / revert of #195.

## Constraints and known issues

- Empty hint regions remain in describedby so updates stay associated.

## Next steps

1. Done: merged #195 and live-installed 0.127.0.
2. Continue UX polish or admin slices as operator priority allows.
