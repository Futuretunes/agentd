# 2026-09-30 — 0.586.0: High-contrast status underline (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: High-contrast status underline
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.586.0
- Implementation commit(s): b0c03c8
- PR: #1106

## Changes and relevant files

- See feature PR #1106.
- Package 0.586.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1106; live-installed on 192.168.1.20 (0.586.0 / b0c03c84cc9a0579b7e377667d30bcf5b6c04b0e).
- Archive SHA-256: `8d6994b5095044522f7501547aae4799d39ad69e540313e21919b92c8b34477d`
- Revision: `b0c03c84cc9a0579b7e377667d30bcf5b6c04b0e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1106.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1106 and live-installed 0.586.0.
2. Continue a11y form labels.
