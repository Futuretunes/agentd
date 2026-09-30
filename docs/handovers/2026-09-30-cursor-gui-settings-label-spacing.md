# 2026-09-30 — 0.218.0: Settings-section label spacing (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Settings-section labels (Theme) share compact muted spacing
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.218.0
- Branch and base: `feat/gui-settings-label-spacing` on `main` (0.217.0)
- Implementation commit(s): 5587a53
- PR: #377

## Changes and relevant files

- `.settings-section label` uses muted 13px spacing; section selects drop extra top margin.
- Package 0.218.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #377; live-installed on 192.168.1.20 (0.218.0 / 5587a53).
- Archive SHA-256: `31f318ecfb701d59641da98080b1e858bf222551a8dd64aab25721492e4c1c97`
- Revision: `5587a53710eacbde34ac825bf33077dc7defac59`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.217.0 / revert of #377.

## Constraints and known issues

None beyond ordinary label layout polish.

## Next steps

1. Done: merged #377 and live-installed 0.218.0.
2. Align dialog form labels with muted color next.
