# 2026-09-30 — 0.296.0: Turn actions accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation turn actions expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.296.0
- Branch and base: `feat/gui-turn-actions-label` on `main` (0.295.0)
- Implementation commit(s): 66cbbc1
- PR: #533

## Changes and relevant files

- Turn `.actions` sets `role="group"` and `aria-label="Turn actions"`.
- Package 0.296.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #533; live-installed on 192.168.1.20 (0.296.0 / 66cbbc1ee1e24e6e2ed380dcc0a4b814c774f444).
- Archive SHA-256: `56f46c6cb32a744c2985a93820920bdba7ee4fe9556c8b4ac03717d2cd34de33`
- Revision: `66cbbc1ee1e24e6e2ed380dcc0a4b814c774f444`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.295.0 / revert of #533.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #533 and live-installed 0.296.0.
2. Label turn history navigation next.
