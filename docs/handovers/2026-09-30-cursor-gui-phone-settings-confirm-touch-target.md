# 2026-09-30 — 0.584.0: Phone settings confirm touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone settings confirm touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.584.0
- Implementation commit(s): 334204f
- PR: #1102

## Changes and relevant files

- See feature PR #1102.
- Package 0.584.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1102; live-installed on 192.168.1.20 (0.584.0 / 334204fd2df97f304a23518d7b9f55339c22dd5e).
- Archive SHA-256: `98e9946129f8d0e18a017d26bde78856fa3fe8e2e24082d74707f0279dd36ff1`
- Revision: `334204fd2df97f304a23518d7b9f55339c22dd5e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1102.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1102 and live-installed 0.584.0.
2. Continue a11y form labels.
