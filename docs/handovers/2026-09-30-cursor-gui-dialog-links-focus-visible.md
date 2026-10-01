# 2026-09-30 — 0.448.0: Dialog links focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog links focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.448.0
- Implementation commit(s): e6e5813
- PR: #834

## Changes and relevant files

- See feature PR #834.
- Package 0.448.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #834; live-installed on 192.168.1.20 (0.448.0 / e6e5813a19cc0c5073d2c5be6f4e313683ca6f41).
- Archive SHA-256: `c4660ffb30c783cc54fbe5b82e2a3b7e3338608f7e8756d1ea6566556b986ef6`
- Revision: `e6e5813a19cc0c5073d2c5be6f4e313683ca6f41`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #834.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #834 and live-installed 0.448.0.
2. Continue a11y form labels.
