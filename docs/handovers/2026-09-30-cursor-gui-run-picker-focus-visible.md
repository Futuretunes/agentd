# 2026-09-30 — 0.454.0: Run picker focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Run picker focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.454.0
- Implementation commit(s): 357d7b2
- PR: #846

## Changes and relevant files

- See feature PR #846.
- Package 0.454.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #846; live-installed on 192.168.1.20 (0.454.0 / 357d7b20a01f5d3471ef79f22613787c46612478).
- Archive SHA-256: `8a3ef8bb1fcc673c7d6ad8e3140c66785c410bf0475c13c61889682258ad68dd`
- Revision: `357d7b20a01f5d3471ef79f22613787c46612478`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #846.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #846 and live-installed 0.454.0.
2. Continue a11y form labels.
