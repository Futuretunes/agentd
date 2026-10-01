# 2026-09-30 — 0.400.0: File review summary accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: File review summary accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.400.0
- Implementation commit(s): fa0d579
- PR: #740

## Changes and relevant files

- See feature PR #740.
- Package 0.400.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #740; live-installed on 192.168.1.20 (0.400.0 / fa0d5790bbff744460a72a3875298ccdf712d18a).
- Archive SHA-256: `a0efff608d1d91588d076946cf99dcad6ad453ffd85b310701370c2c76882953`
- Revision: `fa0d5790bbff744460a72a3875298ccdf712d18a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #740.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #740 and live-installed 0.400.0.
2. Continue a11y form labels.
