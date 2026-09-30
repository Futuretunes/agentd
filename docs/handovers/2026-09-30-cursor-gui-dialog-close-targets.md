# 2026-09-30 — 0.103.0: Consistent dialog close targets (UX-5 / U16)

- Author/agent: Cursor
- Requested outcome: Dialog × close controls should share one size and hit target instead of varying tall boxes
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.103.0
- Branch and base: `feat/gui-dialog-close-targets` on `main` (0.102.0)
- Implementation commit(s): 82a57af
- PR: #147

## Changes and relevant files

- `.review-head button` is a 44×44 transparent × control with muted/hover colour.
- Package 0.103.0; CSS/HTML assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #147; live-installed on 192.168.1.20 (0.103.0 / d7e52e1bf9fc).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.102.0 / revert of #147.

## Constraints and known issues

- Text “Close” buttons inside forms (Cancel) remain secondary actions, not × icons.
- Dynamic dialogs created in JS already use the same review-head pattern.

## Next steps

1. Done: merged #147 and live-installed 0.103.0.
2. Continue UX polish or admin slices as operator priority allows.
