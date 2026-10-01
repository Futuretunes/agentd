# 2026-09-30 — 0.311.0: Agent adapters accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration Agent adapters section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.311.0
- Branch and base: `feat/gui-config-agent-adapters-label` on `main` (0.310.0)
- Implementation commit(s): 8d36456
- PR: #563

## Changes and relevant files

- Configuration Agent adapters section sets `aria-label="Agent adapters"`.
- Package 0.311.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #563; live-installed on 192.168.1.20 (0.311.0 / 8d36456ef068b66a173a6938e830680ef0ba22be).
- Archive SHA-256: `9948ff7be005a4bb7865298919cb96c99a2d548d958928884f5c51a05dd5b2eb`
- Revision: `8d36456ef068b66a173a6938e830680ef0ba22be`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.310.0 / revert of #563.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #563 and live-installed 0.311.0.
2. Label Where to change things next.
