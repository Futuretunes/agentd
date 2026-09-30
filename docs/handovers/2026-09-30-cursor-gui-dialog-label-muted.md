# 2026-09-30 — 0.219.0: Dialog label muted color (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Dialog form labels use muted text color consistently
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.219.0
- Branch and base: `feat/gui-dialog-label-muted` on `main` (0.218.0)
- Implementation commit(s): 7bcee5b
- PR: #379

## Changes and relevant files

- `dialog label` sets `color: var(--muted)` to match settings, action-row and picker labels.
- Package 0.219.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #379; live-installed on 192.168.1.20 (0.219.0 / 705110b91467bfed3f5fb3c49c4f08e27e6c69db).
- Archive SHA-256: `b2f5c961033a94949a401a7dea0174bc1cf62371ce3dec8fdeb8fc86470384cf`
- Revision: `705110b91467bfed3f5fb3c49c4f08e27e6c69db`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.218.0 / revert of #379.

## Constraints and known issues

None beyond ordinary label color polish.

## Next steps

1. Done: merged #379 and live-installed 0.219.0.
2. Align login Access key label with muted color next.
