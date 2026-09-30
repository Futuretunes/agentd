# 2026-09-30 — 0.155.0: Conversation heading landmark (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Desk conversation header must expose a landmark name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.155.0
- Branch and base: `feat/gui-header-label` on `main` (0.154.0)
- Implementation commit(s): 0a879d2
- PR: #251

## Changes and relevant files

- `main.desk > header` aria-label "Conversation heading".
- Package 0.155.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #251; live-installed on 192.168.1.20 (0.155.0 / 0a879d2).
- Archive SHA-256: `88854eabab3776e205448e1633a8237dedcc5721501cf282745f87af53fcf7d6`
- Revision: `0a879d252481559d1a91209fd419a0c5d5eb62d4`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.154.0 / revert of #251.

## Constraints and known issues

- Complements Conversation workspace main landmark and Message composer complementary.

## Next steps

1. Done: merged #251 and live-installed 0.155.0.
2. Continue UX polish or admin slices as operator priority allows.
