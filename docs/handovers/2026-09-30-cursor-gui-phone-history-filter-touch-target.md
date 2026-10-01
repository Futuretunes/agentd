# 2026-09-30 — 0.535.0: Phone history filter touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone history filter touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.535.0
- Implementation commit(s): bc601e1
- PR: #1004

## Changes and relevant files

- See feature PR #1004.
- Package 0.535.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1004; live-installed on 192.168.1.20 (0.535.0 / bc601e1a1d76d5c8c59c5d2761d66884e612f447).
- Archive SHA-256: `f5f4ab01d62c15390e74c3a165aab003aac8700acf13aaf98638b94ba9918f73`
- Revision: `bc601e1a1d76d5c8c59c5d2761d66884e612f447`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1004.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1004 and live-installed 0.535.0.
2. Continue a11y form labels.
