# 2026-09-30 — 0.384.0: Turn status live region (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Turn status live region
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.384.0
- Implementation commit(s): affa862
- PR: #708

## Changes and relevant files

- See feature PR #708.
- Package 0.384.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #708; live-installed on 192.168.1.20 (0.384.0 / affa8624e1fcc2fe597b77511ed0d3159784add9).
- Archive SHA-256: `6ff8829ceffe29998c59ad8d3af6f8df1d38e81cc743d882037aecfab332962a`
- Revision: `affa8624e1fcc2fe597b77511ed0d3159784add9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #708.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #708 and live-installed 0.384.0.
2. Continue a11y form labels.
