# 2026-09-30 — 0.196.0: Access-key content accessible name (UX-1 / U2)

- Author/agent: Cursor
- Requested outcome: Access-key settings content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.196.0
- Branch and base: `feat/gui-access-key-content-label` on `main` (0.195.0)
- Implementation commit(s): 84d1308
- PR: #333

## Changes and relevant files

- `#access-key-content` sets `aria-label="Access key"`.
- Package 0.196.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #333; live-installed on 192.168.1.20 (0.196.0 / 84d1308).
- Archive SHA-256: `91d4caf8c8565f338a0aef405aac76ae932d77cebe2958e9278fc9bccf962043`
- Revision: `84d1308`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.195.0 / revert of #333.

## Constraints and known issues

- Complements existing polite live region on the same element (0.170.0).

## Next steps

1. Done: merged #333 and live-installed 0.196.0.
2. Continue remaining a11y labeling polish.
