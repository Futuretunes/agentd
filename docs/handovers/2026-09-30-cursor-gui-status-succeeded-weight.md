# 2026-09-30 — 0.525.0: Succeeded status weight (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Succeeded status weight
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.525.0
- Implementation commit(s): d526f2c
- PR: #985

## Changes and relevant files

- See feature PR #985.
- Package 0.525.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #985; live-installed on 192.168.1.20 (0.525.0 / d526f2c01745cbfd8efddd946776d1fce08f07d1).
- Archive SHA-256: `27d730d415c33ea3fad0d61e8378402f1635fa80a000ae2049522a707415140b`
- Revision: `d526f2c01745cbfd8efddd946776d1fce08f07d1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #985.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #985 and live-installed 0.525.0.
2. Continue a11y form labels.
