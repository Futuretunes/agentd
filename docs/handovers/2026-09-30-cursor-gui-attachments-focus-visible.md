# 2026-09-30 — 0.456.0: Attachments focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Attachments focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.456.0
- Implementation commit(s): 77f77c6
- PR: #850

## Changes and relevant files

- See feature PR #850.
- Package 0.456.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #850; live-installed on 192.168.1.20 (0.456.0 / 77f77c6addb5cb67146edfffa668c9e9bec1ef41).
- Archive SHA-256: `1ab8f5312a42795cdaf8d4fde6250f51cd0baae866640f7db7cf72de3030cefb`
- Revision: `77f77c6addb5cb67146edfffa668c9e9bec1ef41`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #850.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #850 and live-installed 0.456.0.
2. Continue a11y form labels.
