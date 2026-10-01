# 2026-09-30 — 0.406.0: Checkbox focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Checkbox focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.406.0
- Implementation commit(s): f8262ee
- PR: #752

## Changes and relevant files

- See feature PR #752.
- Package 0.406.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #752; live-installed on 192.168.1.20 (0.406.0 / f8262ee86a059c08ef784ec3d81b966e4f14d8bb).
- Archive SHA-256: `67703a8f93f6d01ab321ead877676faa2a34c2de1546fb1e725c3600a8704949`
- Revision: `f8262ee86a059c08ef784ec3d81b966e4f14d8bb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #752.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #752 and live-installed 0.406.0.
2. Continue a11y form labels.
