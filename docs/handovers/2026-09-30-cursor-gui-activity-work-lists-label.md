# 2026-09-30 — 0.304.0: Activity work list accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity work list sections expose stable accessible names
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.304.0
- Branch and base: `feat/gui-activity-work-lists-label` on `main` (0.303.0)
- Implementation commit(s): 659dd33
- PR: #549

## Changes and relevant files

- Activity Current work / Needs attention / Recent work sections set `aria-label` from their titles.
- Package 0.304.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #549; live-installed on 192.168.1.20 (0.304.0 / 659dd331bfc7852cd5adc21988e70f4dffee8a3a).
- Archive SHA-256: `a6a7e58ff2058885f2ceb701d1f4dcc83e7d73aa278c09c8d24dd3fc42096e5e`
- Revision: `659dd331bfc7852cd5adc21988e70f4dffee8a3a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.303.0 / revert of #549.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #549 and live-installed 0.304.0.
2. Label turn Run history disclosure next.
