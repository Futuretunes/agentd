# 2026-09-30 — 0.273.0: Check setup dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Check setup dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.273.0
- Branch and base: `feat/gui-check-setup-head-label` on `main` (0.272.0)
- Implementation commit(s): 4e82eff
- PR: #487

## Changes and relevant files

- Check setup dialog `.review-head` sets `role="group"` and `aria-label="Check setup heading"`.
- Package 0.273.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #487; live-installed on 192.168.1.20 (0.273.0 / 4e82effb862db565b13aab65a5a80776d8c2037f).
- Archive SHA-256: `9621441221a97a45bc199fb74eca56803ef0e5e0e1743f04fcb887584be3aaa9`
- Revision: `4e82effb862db565b13aab65a5a80776d8c2037f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.272.0 / revert of #487.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #487 and live-installed 0.273.0.
2. Label access key dialog heading next.
