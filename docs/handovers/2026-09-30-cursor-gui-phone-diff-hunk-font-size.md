# 2026-09-30 — 0.598.0: Phone diff hunk font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone diff hunk font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.598.0
- Implementation commit(s): a87f6dc
- PR: #1130

## Changes and relevant files

- See feature PR #1130.
- Package 0.598.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1130; live-installed on 192.168.1.20 (0.598.0 / a87f6dc23e9f6788f299dbbfc0479fd88adf63bb).
- Archive SHA-256: `a36e01083f91a5558d0b30fa3c73031a16d6ac3243869a441e7efabc5cf2dcd6`
- Revision: `a87f6dc23e9f6788f299dbbfc0479fd88adf63bb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1130.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1130 and live-installed 0.598.0.
2. Continue a11y form labels.
