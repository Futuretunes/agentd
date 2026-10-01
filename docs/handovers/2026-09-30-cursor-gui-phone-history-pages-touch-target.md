# 2026-09-30 — 0.529.0: Phone history pagination touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone history pagination touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.529.0
- Implementation commit(s): d75a0ea
- PR: #992

## Changes and relevant files

- See feature PR #992.
- Package 0.529.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #992; live-installed on 192.168.1.20 (0.529.0 / d75a0eabd849b8163b09a43fd7c514f7640adbf4).
- Archive SHA-256: `88c9d580c21f94669f6242e7e5cf0e2ae5f777ebeae4965e703d21c952f723be`
- Revision: `d75a0eabd849b8163b09a43fd7c514f7640adbf4`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #992.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #992 and live-installed 0.529.0.
2. Continue a11y form labels.
