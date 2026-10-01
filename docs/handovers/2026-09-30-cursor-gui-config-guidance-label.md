# 2026-09-30 — 0.312.0: Where to change things accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration Where to change things section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.312.0
- Branch and base: `feat/gui-config-guidance-label` on `main` (0.311.0)
- Implementation commit(s): 18960cb
- PR: #565

## Changes and relevant files

- Configuration Where to change things section sets `aria-label="Where to change things"`.
- Package 0.312.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #565; live-installed on 192.168.1.20 (0.312.0 / 18960cb28223d32256a051c04f385bbbbf88e127).
- Archive SHA-256: `db975b7820dfd89ba08603c7ece11d3a4051961950f3f21d248ae520c6022909`
- Revision: `18960cb28223d32256a051c04f385bbbbf88e127`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.311.0 / revert of #565.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #565 and live-installed 0.312.0.
2. Label Runtime flags next.
