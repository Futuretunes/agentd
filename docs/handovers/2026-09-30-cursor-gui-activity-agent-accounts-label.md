# 2026-09-30 — 0.303.0: Activity agent accounts accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity agent accounts list exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.303.0
- Branch and base: `feat/gui-activity-agent-accounts-label` on `main` (0.302.0)
- Implementation commit(s): 23eb117
- PR: #547

## Changes and relevant files

- Activity accounts list sets `aria-label="Activity agent accounts"`.
- Package 0.303.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #547; live-installed on 192.168.1.20 (0.303.0 / 23eb117ee07978ab1b1eca75f0128a19ea714d3c).
- Archive SHA-256: `5bdf2e6d3d45e585f6fd4292e4214429b3a5d482f3f9f9ffa7d05d91ed242e3c`
- Revision: `23eb117ee07978ab1b1eca75f0128a19ea714d3c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.302.0 / revert of #547.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #547 and live-installed 0.303.0.
2. Label Activity work list sections next.
