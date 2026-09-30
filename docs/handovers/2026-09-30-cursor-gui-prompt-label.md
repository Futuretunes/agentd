# 2026-09-30 — 0.238.0: Composer prompt accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer prompt exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.238.0
- Branch and base: `feat/gui-prompt-label` on `main` (0.237.0)
- Implementation commit(s): 8845591
- PR: #417

## Changes and relevant files

- `#prompt` keeps its screen-reader-only Message your agent label and sets `aria-label="Message your agent"`.
- Package 0.238.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #417; live-installed on 192.168.1.20 (0.238.0 / 8845591254ba0a3e449bc9c5787ac072110e6fab).
- Archive SHA-256: `ba669d0950f2a05c72ce20d2c7acbb2f6afe9d13b36504856214f43494fb7abb`
- Revision: `8845591254ba0a3e449bc9c5787ac072110e6fab`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.237.0 / revert of #417.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #417 and live-installed 0.238.0.
2. Announce live run output politely next.
