# 2026-09-30 — 0.133.0: Composer complementary landmark (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: The sticky composer shell must expose a complementary landmark name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.133.0
- Branch and base: `feat/gui-composer-landmark` on `main` (0.132.0)
- Implementation commit(s): 5c69397
- PR: #207

## Changes and relevant files

- `.composer-wrap` sets `role="complementary"` and `aria-label="Message composer"`.
- Package 0.133.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #207; live-installed on 192.168.1.20 (0.133.0 / 4c8b33b).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.132.0 / revert of #207.

## Constraints and known issues

- Compose form inside remains the primary named control group.

## Next steps

1. Done: merged #207 and live-installed 0.133.0.
2. Continue UX polish or admin slices as operator priority allows.
