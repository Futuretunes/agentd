# 2026-09-30 — 0.103.0: Consistent dialog close targets (UX-5 / U16)

- Author/agent: Cursor
- Requested outcome: Dialog × close controls should share one size and hit target instead of varying tall boxes
- Status: implemented
- Release: 0.103.0
- Branch and base: `feat/gui-dialog-close-targets` on `main` (0.102.0)
- Implementation commit(s): 82a57af
- PR: (filled after open)

## Changes and relevant files

- `.review-head button` is a 44×44 transparent × control with muted/hover colour.
- Package 0.103.0; CSS/HTML assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Text “Close” buttons inside forms (Cancel) remain secondary actions, not × icons.
- Dynamic dialogs created in JS already use the same review-head pattern.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
