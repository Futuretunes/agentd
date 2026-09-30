# 2026-09-30 — 0.206.0: Page notice accessible name (UX-1 / U2)

- Author/agent: Cursor
- Requested outcome: Page notice toast must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.206.0
- Branch and base: `feat/gui-notice-label` on `main` (0.205.0)
- Implementation commit(s): 5d52cf9
- PR: #353

## Changes and relevant files

- `#notice` sets `aria-label="Page notice"`.
- Package 0.206.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #353; live-installed on 192.168.1.20 (0.206.0 / 5d52cf9).
- Archive SHA-256: `cb837757684d1b7bc962e6699d68d76cd5ef62c764573dd10001c57d40d48231`
- Revision: `5d52cf9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.205.0 / revert of #353.

## Constraints and known issues

- Complements polite live announcements and role switching (0.110.0 / 0.156.0).

## Next steps

1. Done: merged #353 and live-installed 0.206.0.
2. Label connection status next.
