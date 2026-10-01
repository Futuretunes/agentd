# 2026-09-30 — 0.574.0: Danger error underline (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Danger error underline
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.574.0
- Implementation commit(s): 00309ca
- PR: #1082

## Changes and relevant files

- See feature PR #1082.
- Package 0.574.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1082; live-installed on 192.168.1.20 (0.574.0 / 00309cad29717cce98ba8cba28b6b334515dc7c8).
- Archive SHA-256: `644c8a4ad1e91e413b3bffb33b858fb8aa1841c4381c9886adc9314cf9728ceb`
- Revision: `00309cad29717cce98ba8cba28b6b334515dc7c8`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1082.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1082 and live-installed 0.574.0.
2. Continue a11y form labels.
