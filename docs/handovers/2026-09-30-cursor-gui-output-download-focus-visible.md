# 2026-09-30 — 0.409.0: Output download focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Output download focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.409.0
- Implementation commit(s): 6a39556
- PR: #758

## Changes and relevant files

- See feature PR #758.
- Package 0.409.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #758; live-installed on 192.168.1.20 (0.409.0 / 6a395563ab57b441e24328c183ac6e927a5fe80e).
- Archive SHA-256: `f6fa45ac5f0ad2dda5d1d802127c656d9e2658995c94819f3e0de45208b17f26`
- Revision: `6a395563ab57b441e24328c183ac6e927a5fe80e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #758.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #758 and live-installed 0.409.0.
2. Continue a11y form labels.
