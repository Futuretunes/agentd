# 2026-09-30 — 0.97.0: Consistent disclosure chevrons (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Approval and file-review disclosures must not use browser-default triangles
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.97.0
- Branch and base: `feat/gui-disclosure-chevrons` on `main` (0.96.0)
- Implementation commit(s): 8fa2538
- PR: #135

## Changes and relevant files

- `public/style.css`: `.turn` and `.file-review` summaries hide native markers and use a shared CSS chevron; reduced-motion disables the rotate transition.
- Package 0.97.0; CSS regression assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #135; live-installed on 192.168.1.20 (0.97.0 / aea89b595d50).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.96.0 / revert of #135.

## Constraints and known issues

- Header menus and the run-picker keep their existing custom markers.
- Logo glyph SVG replacement remains a later U17 item.

## Next steps

1. Done: merged #135 and live-installed 0.97.0.
2. Continue UX polish or admin slices as operator priority allows.
