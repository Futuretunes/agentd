# 2026-09-30 — 0.91.0: Primary Publish after commit (UX-3 / U13)

- Author/agent: Cursor
- Requested outcome: After a successful local commit, the review footer shows one primary next step (Publish, or Recheck when checks are stale) with honest guidance
- Status: implemented
- Release: 0.91.0
- Branch and base: `feat/gui-publish-primary` on `main` (0.90.0)
- Implementation commit(s): (filled after commit)
- PR: (filled after open)

## Changes and relevant files

- `reviewCommittedProgression` in `public/ui.js` chooses `recheck` vs `publish` and next-step copy.
- Committed review UI moves Publish/Recheck into sticky `#review-actions` as the primary control; GitHub feedback remains secondary.
- Package 0.91.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Publication still requires the existing confirm dialog and GitHub ceiling checks.
- Does not auto-publish.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
