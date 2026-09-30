# 2026-09-30 — 0.97.0: Consistent disclosure chevrons (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Approval and file-review disclosures must not use browser-default triangles
- Status: implemented
- Release: 0.97.0
- Branch and base: `feat/gui-disclosure-chevrons` on `main` (0.96.0)
- Implementation commit(s): 8fa2538
- PR: (filled after open)

## Changes and relevant files

- `public/style.css`: `.turn` and `.file-review` summaries hide native markers and use a shared CSS chevron; reduced-motion disables the rotate transition.
- Package 0.97.0; CSS regression assertion in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Header menus and the run-picker keep their existing custom markers.
- Logo glyph SVG replacement remains a later U17 item.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
