# 2026-09-30 — 0.87.0: One primary review step (UX-3 / U13)

- Author/agent: Cursor
- Requested outcome: Pending change review shows one primary progression control with honest next-step copy in the sticky footer; do not present equal competing check buttons
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.87.0
- Branch and base: `feat/gui-review-primary-step` on `main` (0.86.0)
- Implementation commit(s): 08f3bd2
- PR: #115

## Changes and relevant files

- `reviewProgression` in `public/ui.js` picks primary `setup` / `checks` / `commit` / `revise` and the next-step sentence from review state.
- `public/app.js` pending-review actions append only that primary control, then Request revisions and Discard; next-step and commit message move into sticky `#review-actions`.
- No longer appends both Set up checks and Run checks at once. Package 0.87.0; unit coverage in `test/ui.test.mjs`.
- UX-0 New project prerequisite copy noted as already present in product. Did not retouch 0.86 live docs.

## Validation evidence

- CI green on #115; live-installed on 192.168.1.20 (0.87.0 / 9e1d4ec0d809).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.86.0 / revert of #115.

## Constraints and known issues

- Approval Run/Cancel on the conversation turn is unchanged.
- Broader phone full-screen review sheet / file list layout remains separate UX-3 work.

## Next steps

1. Done: merged #115 and live-installed 0.87.0.
2. Remaining UX: notice auto-dismiss / publish progression as separately scoped work.
