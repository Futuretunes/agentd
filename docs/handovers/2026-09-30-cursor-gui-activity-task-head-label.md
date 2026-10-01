# 2026-09-30 — 0.381.0: Activity task heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity task heading accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.381.0
- Implementation commit(s): ef46c26
- PR: #702

## Changes and relevant files

- See feature PR #702.
- Package 0.381.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #702; live-installed on 192.168.1.20 (0.381.0 / ef46c2673f5777524dbd718aedd9c9f77a37f042).
- Archive SHA-256: `fc61d05046fef57e8469b72efaad739f0d71dfedc085d922a73171280d246634`
- Revision: `ef46c2673f5777524dbd718aedd9c9f77a37f042`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #702.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #702 and live-installed 0.381.0.
2. Continue a11y form labels.
