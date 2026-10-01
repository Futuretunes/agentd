# 2026-09-30 — 0.430.0: Configuration dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.430.0
- Implementation commit(s): ae055ab
- PR: #799

## Changes and relevant files

- See feature PR #799.
- Package 0.430.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #799; live-installed on 192.168.1.20 (0.430.0 / ae055ab8ed4eb6144350ade8c1f1c2db69e6e02d).
- Archive SHA-256: `4290082d71795279269dd2cc3599b1f3967e6c1bec4619a071c87c6223a58559`
- Revision: `ae055ab8ed4eb6144350ade8c1f1c2db69e6e02d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #799.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #799 and live-installed 0.430.0.
2. Continue a11y form labels.
