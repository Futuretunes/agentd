# 2026-09-30 — 0.91.0: Primary Publish after commit (UX-3 / U13)

- Author/agent: Cursor
- Requested outcome: After a successful local commit, the review footer shows one primary next step (Publish, or Recheck when checks are stale) with honest guidance
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.91.0
- Branch and base: `feat/gui-publish-primary` on `main` (0.90.0)
- Implementation commit(s): c7307ca
- PR: #123

## Changes and relevant files

- `reviewCommittedProgression` in `public/ui.js` chooses `recheck` vs `publish` and next-step copy.
- Committed review UI moves Publish/Recheck into sticky `#review-actions` as the primary control; GitHub feedback remains secondary.
- Package 0.91.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #123; live-installed on 192.168.1.20 (0.91.0 / 4d28a375cbf7).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.90.0 / revert of #123.

## Constraints and known issues

- Publication still requires the existing confirm dialog and GitHub ceiling checks.
- Does not auto-publish.

## Next steps

1. Done: merged #123 and live-installed 0.91.0.
2. Continue UX polish or admin slices as operator priority allows.
