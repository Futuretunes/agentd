# 2026-09-30 — 0.208.0: Publication error accessible name (UX-3 / U2)

- Author/agent: Cursor
- Requested outcome: Publication confirm error alert must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.208.0
- Branch and base: `feat/gui-publication-error-label` on `main` (0.207.0)
- Implementation commit(s): 14f5804
- PR: #357

## Changes and relevant files

- `#publication-confirm-error` sets `aria-label="Publication error"`.
- Package 0.208.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #357; live-installed on 192.168.1.20 (0.208.0 / 1d14620).
- Archive SHA-256: `c9cb537e684985bf0219270f435aa4eff9e4e75a032d7558809034fed1905448`
- Revision: `1d14620` (docs) / feature `14f5804`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.207.0 / revert of #357.

## Constraints and known issues

- Complements role="alert" on the same element.

## Next steps

1. Done: merged #357 and live-installed 0.208.0.
2. Label publication confirm summary text next.
