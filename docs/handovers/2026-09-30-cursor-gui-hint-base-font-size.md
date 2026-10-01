# 2026-09-30 — 0.571.0: Hint base font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Hint base font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.571.0
- Implementation commit(s): b62cece
- PR: #1076

## Changes and relevant files

- See feature PR #1076.
- Package 0.571.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1076; live-installed on 192.168.1.20 (0.571.0 / b62ceced55b061a8faadf4fd64b42b9c694c0163).
- Archive SHA-256: `7b4cbbc5074725766ad50a4abd6cf5fe2587eee27b0ebd4e87f8a4e26e480c96`
- Revision: `b62ceced55b061a8faadf4fd64b42b9c694c0163`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1076.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1076 and live-installed 0.571.0.
2. Continue a11y form labels.
