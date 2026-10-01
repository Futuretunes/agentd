# 2026-09-30 — 0.385.0: Turn status accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Turn status accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.385.0
- Implementation commit(s): ad70c1a
- PR: #710

## Changes and relevant files

- See feature PR #710.
- Package 0.385.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #710; live-installed on 192.168.1.20 (0.385.0 / ad70c1ae405ea78040338dc88549fbab6d0c0e02).
- Archive SHA-256: `4727afa6fb80d4a8b0c0200de4738abca4307f2d726257c3043d9f2a889581ee`
- Revision: `ad70c1ae405ea78040338dc88549fbab6d0c0e02`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #710.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #710 and live-installed 0.385.0.
2. Continue a11y form labels.
