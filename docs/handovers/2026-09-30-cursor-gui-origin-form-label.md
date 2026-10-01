# 2026-09-30 — 0.359.0: Set signed-in origin form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Set signed-in origin form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.359.0
- Implementation commit(s): 3eedeaa
- PR: #659

## Changes and relevant files

- See feature PR #659.
- Package 0.359.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #659; live-installed on 192.168.1.20 (0.359.0 / 3eedeaa5224da92409e4b736679bfa77430c772e).
- Archive SHA-256: `4764d50e9718c0c9346a534a71629280444ce065026f7e80acd1ba69ca1802f1`
- Revision: `3eedeaa5224da92409e4b736679bfa77430c772e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #659.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #659 and live-installed 0.359.0.
2. Continue a11y form labels.
