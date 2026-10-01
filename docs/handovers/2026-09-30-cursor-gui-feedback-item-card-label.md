# 2026-09-30 — 0.366.0: Feedback item card accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Feedback item card accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.366.0
- Implementation commit(s): 791d7cf
- PR: #673

## Changes and relevant files

- See feature PR #673.
- Package 0.366.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #673; live-installed on 192.168.1.20 (0.366.0 / 791d7cf3840fcb9f97c9844a2c2d358e599f9b2d).
- Archive SHA-256: `7ce76054276aaff33b853a25e344feea0dff075d38c52d4484b4fc68fa6771c9`
- Revision: `791d7cf3840fcb9f97c9844a2c2d358e599f9b2d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #673.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #673 and live-installed 0.366.0.
2. Continue a11y form labels.
