# 2026-09-30 — 0.254.0: Composer tools group accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer tools group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.254.0
- Branch and base: `feat/gui-composer-tools-label` on `main` (0.253.0)
- Implementation commit(s): de59c86
- PR: #449

## Changes and relevant files

- Composer `.tools` sets `role="group"` and `aria-label="Composer tools"`.
- Package 0.254.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #449; live-installed on 192.168.1.20 (0.254.0 / de59c86a7c830750171ec21018ca4b9d0a339f8a).
- Archive SHA-256: `c33697167a373e5dadb92e7ff40541cced967163f539b84659572dcfee443dc1`
- Revision: `de59c86a7c830750171ec21018ca4b9d0a339f8a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.253.0 / revert of #449.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #449 and live-installed 0.254.0.
2. Label composer foot actions group next.
