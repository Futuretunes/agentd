# 2026-09-30 — 0.401.0: Agent answer accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent answer accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.401.0
- Implementation commit(s): 6a9dea8
- PR: #742

## Changes and relevant files

- See feature PR #742.
- Package 0.401.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #742; live-installed on 192.168.1.20 (0.401.0 / 6a9dea8c9ea4cb4c518804eb1731523f7f1bc30d).
- Archive SHA-256: `9e5bf8e2bfc4e5228550026520d9fc1f4141de13004edde322b863d131b58864`
- Revision: `6a9dea8c9ea4cb4c518804eb1731523f7f1bc30d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #742.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #742 and live-installed 0.401.0.
2. Continue a11y form labels.
