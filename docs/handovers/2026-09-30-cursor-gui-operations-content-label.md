# 2026-09-30 — 0.174.0: Activity list region accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity dialog content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.174.0
- Branch and base: `feat/gui-operations-content-label` on `main` (0.173.0)
- Implementation commit(s): 9ed3117
- PR: #289

## Changes and relevant files

- `#operations-content` aria-label "Activity list" (keeps aria-live polite).
- Package 0.174.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #289; live-installed on 192.168.1.20 (0.174.0 / 9ed3117).
- Archive SHA-256: `0940d88203e16d9ce23b9ac90cb6c93ac6d8e0932a76be9ce7da3bbf771138c2`
- Revision: `9ed3117`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.173.0 / revert of #289.

## Constraints and known issues

- Complements Activity dialog heading and nav label.

## Next steps

1. Done: merged #289 and live-installed 0.174.0.
2. Continue UX polish or admin slices as operator priority allows.
