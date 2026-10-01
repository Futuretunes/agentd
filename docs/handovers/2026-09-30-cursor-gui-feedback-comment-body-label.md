# 2026-09-30 — 0.391.0: Feedback comment body accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Feedback comment body accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.391.0
- Implementation commit(s): 8d830b5
- PR: #722

## Changes and relevant files

- See feature PR #722.
- Package 0.391.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #722; live-installed on 192.168.1.20 (0.391.0 / 8d830b5b795bafa862ec58363e01a0decf7b3785).
- Archive SHA-256: `d71dd5eb5c7fa2a739386c266cf906425c0012b0669896f58357c3de7a78e101`
- Revision: `8d830b5b795bafa862ec58363e01a0decf7b3785`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #722.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #722 and live-installed 0.391.0.
2. Continue a11y form labels.
