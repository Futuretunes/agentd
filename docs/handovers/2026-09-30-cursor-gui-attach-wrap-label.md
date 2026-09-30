# 2026-09-30 — 0.259.0: Image attachment wrap accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Image attachment control wrap exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.259.0
- Branch and base: `feat/gui-attach-wrap-label` on `main` (0.258.0)
- Implementation commit(s): 3db7255
- PR: #459

## Changes and relevant files

- Composer `.attach-wrap` sets `role="group"` and `aria-label="Image attachment"`.
- Package 0.259.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #459; live-installed on 192.168.1.20 (0.259.0 / 3db7255feff308b7878ee89ec740fd6c81a2ea92).
- Archive SHA-256: `7b65d61264457edbc7791e19d8dde122f5327af2dc05a0bd7525a6500c82eaec`
- Revision: `3db7255feff308b7878ee89ec740fd6c81a2ea92`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.258.0 / revert of #459.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #459 and live-installed 0.259.0.
2. Label model picker row next.
