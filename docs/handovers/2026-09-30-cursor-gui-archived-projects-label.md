# 2026-09-30 — 0.147.0: Archived projects region accessible name (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: History dialog archived-projects section must expose a stable region name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.147.0
- Branch and base: `feat/gui-archived-projects-label` on `main` (0.146.0)
- Implementation commit(s): bb7b099
- PR: #235

## Changes and relevant files

- `#archived-projects` sets `aria-label="Archived projects"`.
- Package 0.147.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #235; live-installed on 192.168.1.20 (0.147.0 / bb7b099).
- Archive SHA-256: `f31a599fa3a46cf88796267f34913015d576059bf0da7226ae57459bd2878a8d`
- Revision: `bb7b0993ebc2477838fc91d93d3e253de0cc5c2e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.146.0 / revert of #235.

## Constraints and known issues

- Restore buttons keep their own labels.

## Next steps

1. Done: merged #235 and live-installed 0.147.0.
2. Continue UX polish or admin slices as operator priority allows.
