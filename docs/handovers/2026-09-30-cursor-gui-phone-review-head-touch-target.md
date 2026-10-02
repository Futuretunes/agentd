# 2026-09-30 — 0.593.0: Phone review head link touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone review head link touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.593.0
- Implementation commit(s): 9110fac
- PR: #1120

## Changes and relevant files

- See feature PR #1120.
- Package 0.593.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1120; live-installed on 192.168.1.20 (0.593.0 / 9110fac08acca8e3fbbf30abec041e08f9f158dd).
- Archive SHA-256: `871dbeff9c191fb71c13ac90bcfe7a50f17169ac5bf19e9644597d740c9109f3`
- Revision: `9110fac08acca8e3fbbf30abec041e08f9f158dd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1120.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1120 and live-installed 0.593.0.
2. Continue a11y form labels.
