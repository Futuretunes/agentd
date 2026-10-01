# 2026-09-30 — 0.582.0: Section label line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Section label line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.582.0
- Implementation commit(s): 0a477cd
- PR: #1098

## Changes and relevant files

- See feature PR #1098.
- Package 0.582.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1098; live-installed on 192.168.1.20 (0.582.0 / 0a477cd02945a22909a167b1a77198e23ea6f67f).
- Archive SHA-256: `8390367bed1252642499bbde8fc27b84bb5d25b7509a5d60d24664e2ff8732fb`
- Revision: `0a477cd02945a22909a167b1a77198e23ea6f67f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1098.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1098 and live-installed 0.582.0.
2. Continue a11y form labels.
