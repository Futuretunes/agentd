# 2026-09-30 — 0.442.0: Composer controls focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer controls focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.442.0
- Implementation commit(s): c3a94b6
- PR: #822

## Changes and relevant files

- See feature PR #822.
- Package 0.442.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #822; live-installed on 192.168.1.20 (0.442.0 / c3a94b69df3570c9ce8d2a7c8ef440a844f77b09).
- Archive SHA-256: `4c7939a7d6aaa420dd510092a83026ce16d787bd081b7d0b0f8dc9a3228cce76`
- Revision: `c3a94b69df3570c9ce8d2a7c8ef440a844f77b09`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #822.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #822 and live-installed 0.442.0.
2. Continue a11y form labels.
