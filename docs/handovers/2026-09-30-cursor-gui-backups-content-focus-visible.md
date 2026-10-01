# 2026-09-30 — 0.476.0: Backups content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Backups content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.476.0
- Implementation commit(s): c4d9016
- PR: #888

## Changes and relevant files

- See feature PR #888.
- Package 0.476.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #888; live-installed on 192.168.1.20 (0.476.0 / c4d90161e0fbcbd120781adb216729f331d53ae8).
- Archive SHA-256: `0aebdac5337683d2862c21c91622b58f46b765af0bdb8a6d304dca6b4c822d84`
- Revision: `c4d90161e0fbcbd120781adb216729f331d53ae8`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #888.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #888 and live-installed 0.476.0.
2. Continue a11y form labels.
