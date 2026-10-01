# 2026-09-30 — 0.486.0: Feedback form focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Feedback form focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.486.0
- Implementation commit(s): 12e3e4f
- PR: #907

## Changes and relevant files

- See feature PR #907.
- Package 0.486.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #907; live-installed on 192.168.1.20 (0.486.0 / 12e3e4f23f66133c01b4c20b40978367326c0587).
- Archive SHA-256: `f908813e7419b5d945d889e876da787db1fc50b23a6572d8f74e9eaa696a33be`
- Revision: `12e3e4f23f66133c01b4c20b40978367326c0587`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #907.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #907 and live-installed 0.486.0.
2. Continue a11y form labels.
