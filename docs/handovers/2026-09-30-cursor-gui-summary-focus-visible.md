# 2026-09-30 — 0.408.0: Summary focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Summary focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.408.0
- Implementation commit(s): 55ec539
- PR: #756

## Changes and relevant files

- See feature PR #756.
- Package 0.408.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #756; live-installed on 192.168.1.20 (0.408.0 / 55ec5398a45637cb6820b26bb63c6d3338d9ee88).
- Archive SHA-256: `468de2de32b63e137e9708270e6dc39192b889db9e73be90ef8fd0757dbe89eb`
- Revision: `55ec5398a45637cb6820b26bb63c6d3338d9ee88`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #756.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #756 and live-installed 0.408.0.
2. Continue a11y form labels.
