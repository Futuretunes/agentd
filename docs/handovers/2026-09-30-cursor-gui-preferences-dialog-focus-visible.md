# 2026-09-30 — 0.435.0: Preferences dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Preferences dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.435.0
- Implementation commit(s): 7f97cad
- PR: #809

## Changes and relevant files

- See feature PR #809.
- Package 0.435.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #809; live-installed on 192.168.1.20 (0.435.0 / 7f97cadc8293455b60e87fff455a9a4414ec5178).
- Archive SHA-256: `6c6541b72ee66d38157be6aea3295c7f5a54fb1068867c31c1240e4913ff43fc`
- Revision: `7f97cadc8293455b60e87fff455a9a4414ec5178`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #809.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #809 and live-installed 0.435.0.
2. Continue a11y form labels.
