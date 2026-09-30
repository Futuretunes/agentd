# 2026-09-30 — 0.133.0: Composer complementary landmark (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: The sticky composer shell must expose a complementary landmark name
- Status: implemented
- Release: 0.133.0
- Branch and base: `feat/gui-composer-landmark` on `main` (0.132.0)
- Implementation commit(s): 8511ea0
- PR: pending

## Changes and relevant files

- `.composer-wrap` sets `role="complementary"` and `aria-label="Message composer"`.
- Package 0.133.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Compose form inside remains the primary named control group.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
