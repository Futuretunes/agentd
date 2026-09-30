# 2026-09-30 — 0.268.0: GitHub connection dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub connection dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.268.0
- Branch and base: `feat/gui-github-head-label` on `main` (0.267.0)
- Implementation commit(s): 7d87fe2
- PR: #477

## Changes and relevant files

- GitHub dialog `.review-head` sets `role="group"` and `aria-label="GitHub connection heading"`.
- Package 0.268.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #477; live-installed on 192.168.1.20 (0.268.0 / 7d87fe24d511293376afc20ebb89eaaad02e4e65).
- Archive SHA-256: `2177ed5cf7d46c5c8607ae3e2db3064b63bb395eb9ad6dc7a98e835f37b3d381`
- Revision: `7d87fe24d511293376afc20ebb89eaaad02e4e65`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.267.0 / revert of #477.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #477 and live-installed 0.268.0.
2. Label repository dialog heading next.
