# 2026-09-30 — 0.280.0: New project dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: New project dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.280.0
- Branch and base: `feat/gui-project-head-label` on `main` (0.279.0)
- Implementation commit(s): 4b8e0f6
- PR: #501

## Changes and relevant files

- New project form wraps the heading in `#project-heading-group` with `role="group"` and `aria-label="New project heading"`.
- Package 0.280.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #501; live-installed on 192.168.1.20 (0.280.0 / 4b8e0f653411760909bcc3f870ab04f72993ea7d).
- Archive SHA-256: `e312bd83abd9458d05ca326b48854c9a8aa357e55e868d5c63155d9d0f7cfaea`
- Revision: `4b8e0f653411760909bcc3f870ab04f72993ea7d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.279.0 / revert of #501.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #501 and live-installed 0.280.0.
2. Label Request revisions dialog heading next.
