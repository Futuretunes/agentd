# 2026-09-30 — 0.156.0: Polite live page notice toast (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Page notice toast must announce politely in addition to role=status
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.156.0
- Branch and base: `feat/gui-notice-live` on `main` (0.155.0)
- Implementation commit(s): 81e29c0
- PR: #253

## Changes and relevant files

- `#notice` sets `aria-live="polite"` alongside `role="status"`.
- Package 0.156.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #253; live-installed on 192.168.1.20 (0.156.0 / 81e29c0).
- Archive SHA-256: `4082aeb66d245538e45e69d9bf1848bdcc6dd86b47384baf14cff1cc52708a8f`
- Revision: `81e29c03c7d822aeddb698a147c0099234c02081`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.155.0 / revert of #253.

## Constraints and known issues

- Errors still promote to `role="alert"` via noticeRole; live region remains polite for info.

## Next steps

1. Done: merged #253 and live-installed 0.156.0.
2. Continue UX polish or admin slices as operator priority allows.
