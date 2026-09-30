# 2026-09-30 — 0.179.0: Server diagnostics panel accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Server diagnostics dialog content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.179.0
- Branch and base: `feat/gui-diagnostics-content-label` on `main` (0.178.0)
- Implementation commit(s): e90b5d3
- PR: #299

## Changes and relevant files

- `#diagnostics-content` aria-label "Server diagnostics" (keeps aria-live polite).
- Package 0.179.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #299; live-installed on 192.168.1.20 (0.179.0 / e90b5d3).
- Archive SHA-256: `304fb5e5b62a21da0a72372db5e46fec32e8a1120865555ae9b17e33d5f92f84`
- Revision: `e90b5d3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.178.0 / revert of #299.

## Constraints and known issues

- Complements Server diagnostics dialog heading.

## Next steps

1. Done: merged #299 and live-installed 0.179.0.
2. Continue UX polish or admin slices as operator priority allows.
