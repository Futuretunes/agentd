# 2026-09-30 — 0.578.0: Dialog notice line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog notice line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.578.0
- Implementation commit(s): 34e1f3b
- PR: #1090

## Changes and relevant files

- See feature PR #1090.
- Package 0.578.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1090; live-installed on 192.168.1.20 (0.578.0 / 34e1f3bee07e645fe0f95f5df0d3cff833b1bd94).
- Archive SHA-256: `6d298f493ce4c09d647b278e78ee04b150319e5c067169bd9005b99c838ebe51`
- Revision: `34e1f3bee07e645fe0f95f5df0d3cff833b1bd94`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1090.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1090 and live-installed 0.578.0.
2. Continue a11y form labels.
