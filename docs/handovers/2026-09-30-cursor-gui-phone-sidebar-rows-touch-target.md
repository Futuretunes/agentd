# 2026-09-30 — 0.530.0: Phone sidebar row touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone sidebar row touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.530.0
- Implementation commit(s): b1c5e64
- PR: #994

## Changes and relevant files

- See feature PR #994.
- Package 0.530.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #994; live-installed on 192.168.1.20 (0.530.0 / b1c5e644bd79455370082692c10c7f81c22bff0f).
- Archive SHA-256: `8505de3aa3466e0eac484019ccb32b5825540bdaa832942646c437ab961b78ea`
- Revision: `b1c5e644bd79455370082692c10c7f81c22bff0f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #994.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #994 and live-installed 0.530.0.
2. Continue a11y form labels.
