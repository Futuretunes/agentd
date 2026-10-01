# 2026-09-30 — 0.583.0: Phone device code font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone device code font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.583.0
- Implementation commit(s): b62f9e8
- PR: #1100

## Changes and relevant files

- See feature PR #1100.
- Package 0.583.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1100; live-installed on 192.168.1.20 (0.583.0 / b62f9e8a0c9b0d0835c5ea0838fd30041f4ca37a).
- Archive SHA-256: `46b3b2a670400739ae35889ff1895e955485ef1cea6344dba2b07fae369afa25`
- Revision: `b62f9e8a0c9b0d0835c5ea0838fd30041f4ca37a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1100.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1100 and live-installed 0.583.0.
2. Continue a11y form labels.
