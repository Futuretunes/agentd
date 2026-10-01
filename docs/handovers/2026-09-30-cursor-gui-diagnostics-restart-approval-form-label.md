# 2026-09-30 — 0.357.0: Diagnostics restart approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics restart approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.357.0
- Implementation commit(s): 2c36444
- PR: #655

## Changes and relevant files

- See feature PR #655.
- Package 0.357.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #655; live-installed on 192.168.1.20 (0.357.0 / 2c36444e1ea572cfcea37400386baace59d694ee).
- Archive SHA-256: `245fb7f01d13cce6f47a2d9f89a3baf62bf3da9a5d17f004a8ee8ed50bc9cccc`
- Revision: `2c36444e1ea572cfcea37400386baace59d694ee`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #655.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #655 and live-installed 0.357.0.
2. Continue a11y form labels.
