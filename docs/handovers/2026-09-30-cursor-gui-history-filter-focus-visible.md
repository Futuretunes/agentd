# 2026-09-30 — 0.508.0: History filter focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History filter focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.508.0
- Implementation commit(s): 16c8e9b
- PR: #951

## Changes and relevant files

- See feature PR #951.
- Package 0.508.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #951; live-installed on 192.168.1.20 (0.508.0 / 16c8e9b08279fff4a442ee4b606414dc5e1581ee).
- Archive SHA-256: `f8c3e6910719d11d6c2470fdbc317931ab3aa1a31d37aa3a99bf48f4c6df47e6`
- Revision: `16c8e9b08279fff4a442ee4b606414dc5e1581ee`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #951.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #951 and live-installed 0.508.0.
2. Continue a11y form labels.
