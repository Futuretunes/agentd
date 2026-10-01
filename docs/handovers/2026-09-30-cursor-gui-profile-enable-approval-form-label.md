# 2026-09-30 — 0.353.0: Enable profile approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Enable profile approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.353.0
- Implementation commit(s): e81f0ce
- PR: #647

## Changes and relevant files

- See feature PR #647.
- Package 0.353.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #647; live-installed on 192.168.1.20 (0.353.0 / e81f0ce9c0929d82c8db2d5411c7ae018762f87f).
- Archive SHA-256: `d5c9b017cbc55cfe944f15e0c5cc8b54d2f05134acb9f63e444154147825518b`
- Revision: `e81f0ce9c0929d82c8db2d5411c7ae018762f87f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #647.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #647 and live-installed 0.353.0.
2. Continue a11y form labels.
