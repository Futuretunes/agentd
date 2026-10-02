# 2026-09-30 — 0.595.0: Phone sidebar brand touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone sidebar brand touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.595.0
- Implementation commit(s): b4c2d78
- PR: #1124

## Changes and relevant files

- See feature PR #1124.
- Package 0.595.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1124; live-installed on 192.168.1.20 (0.595.0 / b4c2d782609a8e2dca8fa894aaac3d4325ad5573).
- Archive SHA-256: `4b8762089038ea83695ed32cebc2586e18eec69bead1d78958e29e1c77a8095b`
- Revision: `b4c2d782609a8e2dca8fa894aaac3d4325ad5573`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1124.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1124 and live-installed 0.595.0.
2. Continue a11y form labels.
