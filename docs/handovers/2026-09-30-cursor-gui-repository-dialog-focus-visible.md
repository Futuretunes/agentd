# 2026-09-30 — 0.438.0: Repository dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Repository dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.438.0
- Implementation commit(s): b46793c
- PR: #815

## Changes and relevant files

- See feature PR #815.
- Package 0.438.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #815; live-installed on 192.168.1.20 (0.438.0 / b46793c916a2c05326c36efb5222a6259cf4a7b4).
- Archive SHA-256: `d0fda009411ed60ed1ecb6b5f92edef241960e860188e12bf848d810e7b57a89`
- Revision: `b46793c916a2c05326c36efb5222a6259cf4a7b4`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #815.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #815 and live-installed 0.438.0.
2. Continue a11y form labels.
