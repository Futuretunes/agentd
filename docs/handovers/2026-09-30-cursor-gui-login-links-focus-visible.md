# 2026-09-30 — 0.452.0: Sign-in links focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sign-in links focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.452.0
- Implementation commit(s): a43127f
- PR: #842

## Changes and relevant files

- See feature PR #842.
- Package 0.452.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #842; live-installed on 192.168.1.20 (0.452.0 / a43127fdba7db8da0ad547c6981b3d5141df7349).
- Archive SHA-256: `4b75c1436ee6974acc5020c32d0174b03f0dbd90c67de46247bbf131a633100c`
- Revision: `a43127fdba7db8da0ad547c6981b3d5141df7349`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #842.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #842 and live-installed 0.452.0.
2. Continue a11y form labels.
