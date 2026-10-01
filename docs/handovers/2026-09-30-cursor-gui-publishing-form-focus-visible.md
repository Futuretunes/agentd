# 2026-09-30 — 0.483.0: Publishing form focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publishing form focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.483.0
- Implementation commit(s): 99639e0
- PR: #901

## Changes and relevant files

- See feature PR #901.
- Package 0.483.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #901; live-installed on 192.168.1.20 (0.483.0 / 99639e055baf0dde12276b1d00f920f5e4e45bb1).
- Archive SHA-256: `5de3348403d09aac0124ec333a5bc03a30861be982ada8e58a980c97433860b4`
- Revision: `99639e055baf0dde12276b1d00f920f5e4e45bb1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #901.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #901 and live-installed 0.483.0.
2. Continue a11y form labels.
