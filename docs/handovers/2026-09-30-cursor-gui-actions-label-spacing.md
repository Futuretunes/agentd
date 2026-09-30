# 2026-09-30 — 0.217.0: Action-row label spacing (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Action-row labels (such as History Show) share compact muted spacing
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.217.0
- Branch and base: `feat/gui-actions-label-spacing` on `main` (0.216.0)
- Implementation commit(s): 966c0e4
- PR: #375

## Changes and relevant files

- `.actions label` uses inline-flex, muted color, 13px, nowrap spacing for compact filter rows.
- Package 0.217.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #375; live-installed on 192.168.1.20 (0.217.0 / b6ead65).
- Archive SHA-256: `025bdf9e87d3a398f9c8e440e20892783d76dfcf89545db2cfd7db40fad55b48`
- Revision: `b6ead6522242d19ce2533a7abbac7a83632cb612`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.216.0 / revert of #375.

## Constraints and known issues

None beyond ordinary label layout polish.

## Next steps

1. Done: merged #375 and live-installed 0.217.0.
2. Align settings-section labels (Theme) with the same muted spacing next.
