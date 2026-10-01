# 2026-09-30 — 0.572.0: Actions button font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Actions button font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.572.0
- Implementation commit(s): 5c7da40
- PR: #1078

## Changes and relevant files

- See feature PR #1078.
- Package 0.572.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1078; live-installed on 192.168.1.20 (0.572.0 / 5c7da40988780b44da7cbbd356d7beca8e405daa).
- Archive SHA-256: `0909df433b53c98c330945b763459c7ad5900a867e0568978ee537aac4d58b30`
- Revision: `5c7da40988780b44da7cbbd356d7beca8e405daa`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1078.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1078 and live-installed 0.572.0.
2. Continue a11y form labels.
