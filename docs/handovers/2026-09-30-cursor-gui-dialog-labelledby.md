# 2026-09-30 — 0.115.0: Dialog labelled-by headings (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Every workspace `<dialog>` must expose an accessible name via `aria-labelledby`
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.115.0
- Branch and base: `feat/gui-dialog-labelledby` on `main` (0.114.0)
- Implementation commit(s): 8f81fa1
- PR: #171

## Changes and relevant files

- Remaining dialogs gain `aria-labelledby` and matching heading `id`s (project, Activity, review, history, run, GitHub, checks, publish, revision, publication confirm, feedback).
- Package 0.115.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #171; live-installed on 192.168.1.20 (0.115.0 / 71337e8).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.114.0 / revert of #171.

## Constraints and known issues

- Dynamically created dialogs (cleanup preview) already set headings in JS; this slice covers static markup.

## Next steps

1. Done: merged #171 and live-installed 0.115.0.
2. Continue UX polish or admin slices as operator priority allows.
