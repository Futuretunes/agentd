# 2026-09-30 — 0.500.0: Project defaults focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Project defaults focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.500.0
- Implementation commit(s): c109832
- PR: #935

## Changes and relevant files

- See feature PR #935.
- Package 0.500.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #935; live-installed on 192.168.1.20 (0.500.0 / c10983249b16eecfd7bdba871ff822b42ffbbbeb).
- Archive SHA-256: `17fc554ed864802adae14a9596699a1c16413256fdb03faaac0b0a2c3233418f`
- Revision: `c10983249b16eecfd7bdba871ff822b42ffbbbeb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #935.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #935 and live-installed 0.500.0.
2. Continue a11y form labels.
