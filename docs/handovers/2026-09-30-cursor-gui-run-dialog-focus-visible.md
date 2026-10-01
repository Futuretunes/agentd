# 2026-09-30 — 0.434.0: Run dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Run dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.434.0
- Implementation commit(s): 9d4ab41
- PR: #807

## Changes and relevant files

- See feature PR #807.
- Package 0.434.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #807; live-installed on 192.168.1.20 (0.434.0 / 9d4ab41c632c544a11e1414800aad4ddd3ceae16).
- Archive SHA-256: `a00291577880ece333ab003d2caeab54849a4924c671ae3253282d076fd6375d`
- Revision: `9d4ab41c632c544a11e1414800aad4ddd3ceae16`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #807.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #807 and live-installed 0.434.0.
2. Continue a11y form labels.
