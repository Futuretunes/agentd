# 2026-09-30 — 0.364.0: Repository job section accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Repository job section accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.364.0
- Implementation commit(s): 25014c7
- PR: #669

## Changes and relevant files

- See feature PR #669.
- Package 0.364.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #669; live-installed on 192.168.1.20 (0.364.0 / 25014c73e3d4c3e0ec586e4374971591ebc02af2).
- Archive SHA-256: `2d027982741b16f204f581a687c68bb534d31d5bb197c294e075f8180eb0bfb2`
- Revision: `25014c73e3d4c3e0ec586e4374971591ebc02af2`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #669.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #669 and live-installed 0.364.0.
2. Continue a11y form labels.
