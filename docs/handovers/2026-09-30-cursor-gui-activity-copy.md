# 2026-09-30 — 0.106.0: Activity naming in user-facing copy (UX-2 / U4)

- Author/agent: Cursor
- Requested outcome: User-visible guidance should say Activity (the shipped nav label), not Operations
- Status: implemented
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

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Historical docs/reviews still say Operations; product copy is the gate for this slice.
- Internal function names (`loadOperations`, `renderOperations`) stay as-is.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
