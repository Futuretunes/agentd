# 2026-09-30 — 0.443.0: Conversation region focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation region focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.443.0
- Implementation commit(s): 88c0da1
- PR: #824

## Changes and relevant files

- See feature PR #824.
- Package 0.443.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #824; live-installed on 192.168.1.20 (0.443.0 / 88c0da17b9a8014f397c098ffeac009848e4b886).
- Archive SHA-256: `fd8ac98a288373c9a6b3d50d620ffed014feb83b68939003542fbc4382172986`
- Revision: `88c0da17b9a8014f397c098ffeac009848e4b886`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #824.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #824 and live-installed 0.443.0.
2. Continue a11y form labels.
