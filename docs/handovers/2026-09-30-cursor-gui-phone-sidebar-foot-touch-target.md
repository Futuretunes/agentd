# 2026-09-30 — 0.557.0: Phone sidebar foot touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone sidebar foot touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.557.0
- Implementation commit(s): 75ea91e
- PR: #1048

## Changes and relevant files

- See feature PR #1048.
- Package 0.557.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1048; live-installed on 192.168.1.20 (0.557.0 / 75ea91e893feb47372bedde2ec9916212cc7935c).
- Archive SHA-256: `bc7d1590ec0295493f5ac3114f117d2407195865d6e9cc0c3024b3ed6a386b5b`
- Revision: `75ea91e893feb47372bedde2ec9916212cc7935c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1048.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1048 and live-installed 0.557.0.
2. Continue a11y form labels.
