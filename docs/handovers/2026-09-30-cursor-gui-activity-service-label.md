# 2026-09-30 — 0.301.0: Activity service accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity service section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.301.0
- Branch and base: `feat/gui-activity-service-label` on `main` (0.300.0)
- Implementation commit(s): 207d137
- PR: #543

## Changes and relevant files

- Activity service `operation-section` sets `aria-label="Activity service"`.
- Package 0.301.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #543; live-installed on 192.168.1.20 (0.301.0 / 207d137c1a7974c1a5038afe1f37a0fd8838f96f).
- Archive SHA-256: `922381c2e5e34f2a2e8fad4fe88048a29b45ef6e003782cf590b03ee62db95c1`
- Revision: `207d137c1a7974c1a5038afe1f37a0fd8838f96f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.300.0 / revert of #543.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #543 and live-installed 0.301.0.
2. Label Activity storage section next.
