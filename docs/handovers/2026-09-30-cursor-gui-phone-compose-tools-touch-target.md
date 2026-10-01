# 2026-09-30 — 0.558.0: Phone composer tools touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone composer tools touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.558.0
- Implementation commit(s): 1f709a4
- PR: #1050

## Changes and relevant files

- See feature PR #1050.
- Package 0.558.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1050; live-installed on 192.168.1.20 (0.558.0 / 1f709a458108a15a274891870a2f7bea3593b4f5).
- Archive SHA-256: `e5a02e3a5fa1c7785ae9502edc31973ce807ccb683887d1c387e08b4656e8279`
- Revision: `1f709a458108a15a274891870a2f7bea3593b4f5`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1050.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1050 and live-installed 0.558.0.
2. Continue a11y form labels.
