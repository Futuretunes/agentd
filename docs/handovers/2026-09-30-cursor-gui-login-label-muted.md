# 2026-09-30 — 0.220.0: Login label muted color (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Login Access key label uses muted text color
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.220.0
- Branch and base: `feat/gui-login-label-muted` on `main` (0.219.0)
- Implementation commit(s): 27931df
- PR: #381

## Changes and relevant files

- `.login label` uses muted 13px color matching dialog and settings labels.
- Package 0.220.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #381; live-installed on 192.168.1.20 (0.220.0 / 27931df00910461cbf417b0c4eb7a2c1fe7919af).
- Archive SHA-256: `23433fdf1c0c3446be84b49d56a526c09ef347ba8690a83ab0e5b445b5b602a2`
- Revision: `27931df00910461cbf417b0c4eb7a2c1fe7919af`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.219.0 / revert of #381.

## Constraints and known issues

None beyond ordinary label color polish.

## Next steps

1. Done: merged #381 and live-installed 0.220.0.
2. Tighten first dialog form label top margin next.
