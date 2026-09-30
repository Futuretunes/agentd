# 2026-09-30 — 0.111.0: Honest no-project New/Send reasons (UX-1 / U10)

- Author/agent: Cursor
- Requested outcome: When no project is selected, New conversation and Send explain why they are blocked
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.111.0
- Branch and base: `feat/gui-new-conversation-reason` on `main` (0.110.0)
- Implementation commit(s): d7cf722
- PR: #163

## Changes and relevant files

- `noProjectActionReason` supplies New vs Send copy.
- `#new` and empty-list CTA disable with a title when `projectId` is missing.
- Composer `#hint` states the Send block reason before other idle hints.
- Package 0.111.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #163; live-installed on 192.168.1.20 (0.111.0 / f3b5c6c).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.110.0 / revert of #163.

## Constraints and known issues

- Empty CTA still calls `#new`; with no project both stay disabled and titled.
- Create-project remains available via ＋ in the Projects header.

## Next steps

1. Done: merged #163 and live-installed 0.111.0.
2. Continue UX polish or admin slices as operator priority allows.
