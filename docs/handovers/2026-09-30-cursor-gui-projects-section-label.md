# 2026-09-30 — 0.261.0: Projects section heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Projects section heading exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.261.0
- Branch and base: `feat/gui-projects-section-label` on `main` (0.260.0)
- Implementation commit(s): 5447b3b
- PR: #463

## Changes and relevant files

- Projects `.section-label` sets `role="group"` and `aria-label="Projects section"`.
- Package 0.261.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #463; live-installed on 192.168.1.20 (0.261.0 / 5447b3b195b70350b9555ed4ab8b79fb51b62015).
- Archive SHA-256: `4115fd2b796a16db445c6677cef51ace3cd02d49296f5fb3743910d0dc092816`
- Revision: `5447b3b195b70350b9555ed4ab8b79fb51b62015`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.260.0 / revert of #463.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #463 and live-installed 0.261.0.
2. Label conversations section heading next.
