# 2026-09-30 — 0.599.0: Phone message head font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone message head font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.599.0
- Implementation commit(s): 4e47d1f
- PR: #1132

## Changes and relevant files

- See feature PR #1132.
- Package 0.599.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1132; live-installed on 192.168.1.20 (0.599.0 / 4e47d1f7727915caa4196aa72081368a8156c28d).
- Archive SHA-256: `61c521752f0e47fc30df8c72d85e1d2482fd65ea60c7aba9e037f58ad7e34b23`
- Revision: `4e47d1f7727915caa4196aa72081368a8156c28d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1132.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1132 and live-installed 0.599.0.
2. Continue a11y form labels.
