# 2026-09-30 — 0.151.0: Phone notice toast safe-area (UX-4 / U18)

- Author/agent: Cursor
- Requested outcome: Page notice toast must clear the home-indicator safe area on phones
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.151.0
- Branch and base: `feat/gui-notice-safe-area` on `main` (0.150.0)
- Implementation commit(s): 1c305a0
- PR: #243

## Changes and relevant files

- Phone `#notice` uses `bottom: max(16px, env(safe-area-inset-bottom))`.
- Package 0.151.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #243; live-installed on 192.168.1.20 (0.151.0 / 1c305a0).
- Archive SHA-256: `8853c2e572f7ee772f65b0721fafd72e124e16e701b94b3ee6ae75653360def6`
- Revision: `1c305a00e40e87277940ed91a4e99241092574b2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.150.0 / revert of #243.

## Constraints and known issues

- Complements login/drawer/header/composer/review safe-area work.

## Next steps

1. Done: merged #243 and live-installed 0.151.0.
2. Continue UX polish or admin slices as operator priority allows.
