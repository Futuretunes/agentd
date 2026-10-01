# 2026-09-30 — 0.461.0: Picker mode focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Picker mode focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.461.0
- Implementation commit(s): 9fa9106
- PR: #860

## Changes and relevant files

- See feature PR #860.
- Package 0.461.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #860; live-installed on 192.168.1.20 (0.461.0 / 9fa9106904f6d3ee40b9dd0cff4e03adca3bbfaf).
- Archive SHA-256: `649893ca4a1a831c0130d0841ece2d5f136ef2504eb566ba70f72bebc2369661`
- Revision: `9fa9106904f6d3ee40b9dd0cff4e03adca3bbfaf`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #860.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #860 and live-installed 0.461.0.
2. Continue a11y form labels.
