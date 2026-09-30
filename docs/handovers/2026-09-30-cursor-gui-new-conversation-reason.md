# 2026-09-30 — 0.111.0: Honest no-project New/Send reasons (UX-1 / U10)

- Author/agent: Cursor
- Requested outcome: When no project is selected, New conversation and Send explain why they are blocked
- Status: implemented
- Release: 0.111.0
- Branch and base: `feat/gui-new-conversation-reason` on `main` (0.110.0)
- Implementation commit(s): d7cf722
- PR: (filled after open)

## Changes and relevant files

- `noProjectActionReason` supplies New vs Send copy.
- `#new` and empty-list CTA disable with a title when `projectId` is missing.
- Composer `#hint` states the Send block reason before other idle hints.
- Package 0.111.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Empty CTA still calls `#new`; with no project both stay disabled and titled.
- Create-project remains available via ＋ in the Projects header.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
