# 2026-09-30 — 0.348.0: Replace TLS certificate approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Replace TLS certificate approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.348.0
- Implementation commit(s): 28606f0
- PR: #637

## Changes and relevant files

- See feature PR #637.
- Package 0.348.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #637; live-installed on 192.168.1.20 (0.348.0 / 28606f044a70c8f5265c8bf6816506cbc08fe347).
- Archive SHA-256: `556a5e17ef9d5ba8b9b25fb2a0e127954c0ab4ebf39c4bde04d373055ab5bbd3`
- Revision: `28606f044a70c8f5265c8bf6816506cbc08fe347`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #637.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #637 and live-installed 0.348.0.
2. Continue a11y form labels.
