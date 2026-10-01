# 2026-09-30 — 0.510.0: Adapter select focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Adapter select focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.510.0
- Implementation commit(s): 28ec0d7
- PR: #955

## Changes and relevant files

- See feature PR #955.
- Package 0.510.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #955; live-installed on 192.168.1.20 (0.510.0 / 28ec0d7a50f7cf5bc56a87d4afca62d26f17cb88).
- Archive SHA-256: `3a281a5417fb67c7d99f2dce4fb5dd2dd9a0c5daa28b2671d4f642332ab9bf8e`
- Revision: `28ec0d7a50f7cf5bc56a87d4afca62d26f17cb88`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #955.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #955 and live-installed 0.510.0.
2. Continue a11y form labels.
