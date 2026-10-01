# 2026-09-30 — 0.439.0: Check setup dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Check setup dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.439.0
- Implementation commit(s): 955ec51
- PR: #817

## Changes and relevant files

- See feature PR #817.
- Package 0.439.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #817; live-installed on 192.168.1.20 (0.439.0 / 955ec51ce4b160899edcf7984bba2c3009a0cfc3).
- Archive SHA-256: `615d616fbeae7e46d555430d615d711a9f1e3025760c8e54ce8b991ce59acb17`
- Revision: `955ec51ce4b160899edcf7984bba2c3009a0cfc3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #817.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #817 and live-installed 0.439.0.
2. Continue a11y form labels.
