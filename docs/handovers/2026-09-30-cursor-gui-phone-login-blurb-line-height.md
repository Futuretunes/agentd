# 2026-09-30 — 0.591.0: Phone login blurb line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone login blurb line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.591.0
- Implementation commit(s): a66e85e
- PR: #1116

## Changes and relevant files

- See feature PR #1116.
- Package 0.591.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1116; live-installed on 192.168.1.20 (0.591.0 / a66e85ed20c36981cd7243c33e0b63e6ec9e352a).
- Archive SHA-256: `4a428e2b856d3ee5f7ea8492868a6697248afc0f44aef3fefd372c504bfe8c34`
- Revision: `a66e85ed20c36981cd7243c33e0b63e6ec9e352a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1116.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1116 and live-installed 0.591.0.
2. Continue a11y form labels.
