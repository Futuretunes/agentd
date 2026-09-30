# 2026-09-30 — 0.106.0: Activity naming in user-facing copy (UX-2 / U4)

- Author/agent: Cursor
- Requested outcome: User-visible guidance should say Activity (the shipped nav label), not Operations
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.106.0
- Branch and base: `feat/gui-activity-copy` on `main` (0.105.0)
- Implementation commit(s): 529c031
- PR: #153

## Changes and relevant files

- GUI strings in `public/app.js` point to Activity.
- Server/public error and renewal guidance in `src/*` and preflight scripts say Activity.
- Package 0.106.0; copy assertion in `test/ui.test.mjs`.
- API path `/api/operations` and internal identifiers unchanged.

## Validation evidence

- CI green on #153; live-installed on 192.168.1.20 (0.106.0 / c9a1326).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.105.0 / revert of #153.

## Constraints and known issues

- Historical docs/reviews still say Operations; product copy is the gate for this slice.
- Internal function names (`loadOperations`, `renderOperations`) stay as-is.

## Next steps

1. Done: merged #153 and live-installed 0.106.0.
2. Continue UX polish or admin slices as operator priority allows.
