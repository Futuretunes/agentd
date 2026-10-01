# 2026-09-30 — 0.415.0: Sidebar foot focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sidebar foot focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.415.0
- Implementation commit(s): bbaaa48
- PR: #770

## Changes and relevant files

- See feature PR #770.
- Package 0.415.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #770; live-installed on 192.168.1.20 (0.415.0 / bbaaa489ba400d96ee1c0d1e1f511922b2f910d1).
- Archive SHA-256: `4a802c0202920670171450480da4ad6e477b857caad1cd5e852fe9b80aeda9f3`
- Revision: `bbaaa489ba400d96ee1c0d1e1f511922b2f910d1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #770.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #770 and live-installed 0.415.0.
2. Continue a11y form labels.
