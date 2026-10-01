# 2026-09-30 — 0.474.0: Updates content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Updates content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.474.0
- Implementation commit(s): 6d99075
- PR: #884

## Changes and relevant files

- See feature PR #884.
- Package 0.474.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #884; live-installed on 192.168.1.20 (0.474.0 / 6d990759a57aacb3723f20d6be75c93de37a300d).
- Archive SHA-256: `ae2ead99cae5b9f691c31c931726a759c1b55192a8b72cde6df992b96dcab61a`
- Revision: `6d990759a57aacb3723f20d6be75c93de37a300d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #884.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #884 and live-installed 0.474.0.
2. Continue a11y form labels.
