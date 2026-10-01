# 2026-09-30 — 0.447.0: Desk links focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Desk links focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.447.0
- Implementation commit(s): 0513dc1
- PR: #832

## Changes and relevant files

- See feature PR #832.
- Package 0.447.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #832; live-installed on 192.168.1.20 (0.447.0 / 0513dc1189b5da58d23aa6d7300da9c187a0ee9b).
- Archive SHA-256: `b28ab0409b8ae40bf94c25bbbea39ac2f68ff8fb98961bf1fc37dbcdabd8a5d7`
- Revision: `0513dc1189b5da58d23aa6d7300da9c187a0ee9b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #832.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #832 and live-installed 0.447.0.
2. Continue a11y form labels.
