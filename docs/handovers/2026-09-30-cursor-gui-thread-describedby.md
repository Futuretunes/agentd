# 2026-09-30 — 0.157.0: Thread title described by project name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation title must be described by the project name eyebrow
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.157.0
- Branch and base: `feat/gui-thread-describedby` on `main` (0.156.0)
- Implementation commit(s): 7b55494
- PR: #255

## Changes and relevant files

- `#thread-title` sets `aria-describedby="project-name"`.
- Package 0.157.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #255; live-installed on 192.168.1.20 (0.157.0 / 7b55494).
- Archive SHA-256: `76637475126a9cf3aabb7c3f14ea13512271802b1353c4df2a63563a13ed8f8a`
- Revision: `7b554946e6dd8f3a410567cf3263360f7e006ea8`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.156.0 / revert of #255.

## Constraints and known issues

- Complements Conversation heading landmark (0.155.0).

## Next steps

1. Done: merged #255 and live-installed 0.157.0.
2. Continue UX polish or admin slices as operator priority allows.
