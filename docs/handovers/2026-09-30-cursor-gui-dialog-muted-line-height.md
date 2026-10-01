# 2026-09-30 — 0.553.0: Dialog muted line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog muted line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.553.0
- Implementation commit(s): 64dad7d
- PR: #1040

## Changes and relevant files

- See feature PR #1040.
- Package 0.553.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1040; live-installed on 192.168.1.20 (0.553.0 / 64dad7d4094f2c1468c951e134f27bfc57cc9b37).
- Archive SHA-256: `a1865166647ade254bf35c8c689595c18a7663c67856102bf37babb1004f2030`
- Revision: `64dad7d4094f2c1468c951e134f27bfc57cc9b37`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1040.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1040 and live-installed 0.553.0.
2. Continue a11y form labels.
