# 2026-09-30 — 0.552.0: Hint line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Hint line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.552.0
- Implementation commit(s): dc4fba8
- PR: #1038

## Changes and relevant files

- See feature PR #1038.
- Package 0.552.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1038; live-installed on 192.168.1.20 (0.552.0 / dc4fba83b03d055c601a0f23aa6f06fa29a91642).
- Archive SHA-256: `c7e4f0a5d39fd85f14b68f1822f2c5c732e881d5315a51747d7aa8e151895335`
- Revision: `dc4fba83b03d055c601a0f23aa6f06fa29a91642`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1038.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1038 and live-installed 0.552.0.
2. Continue a11y form labels.
