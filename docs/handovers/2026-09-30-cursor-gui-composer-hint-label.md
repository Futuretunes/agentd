# 2026-09-30 — 0.200.0: Composer hint accessible name (UX-1 / U2)

- Author/agent: Cursor
- Requested outcome: Primary composer hint must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.200.0
- Branch and base: `feat/gui-composer-hint-label` on `main` (0.199.0)
- Implementation commit(s): 44cc87d
- PR: #341

## Changes and relevant files

- `#hint` sets `aria-label="Composer status"`.
- Package 0.200.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #341; live-installed on 192.168.1.20 (0.200.0 / 44cc87d).
- Archive SHA-256: `8aa797ea7cc7861351be2e28959e65c5f76dec43d6827e6ca7657dc4b5b5c329`
- Revision: `44cc87d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.199.0 / revert of #341.

## Constraints and known issues

- Completes the draft/policy/composer hint naming set with 0.198.0 and 0.199.0.

## Next steps

1. Done: merged #341 and live-installed 0.200.0.
2. Continue remaining a11y labeling polish.
