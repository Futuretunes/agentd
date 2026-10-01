# 2026-09-30 — 0.569.0: Dialog label line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog label line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.569.0
- Implementation commit(s): 95b0151
- PR: #1072

## Changes and relevant files

- See feature PR #1072.
- Package 0.569.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1072; live-installed on 192.168.1.20 (0.569.0 / 95b0151743b4d08aeb24d958d635d4a2fdfb91ab).
- Archive SHA-256: `ea0efec45afa6fb5ac9bcbef01aa64ab9cc2bf311a78836c3cfbb015cc675a82`
- Revision: `95b0151743b4d08aeb24d958d635d4a2fdfb91ab`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1072.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1072 and live-installed 0.569.0.
2. Continue a11y form labels.
