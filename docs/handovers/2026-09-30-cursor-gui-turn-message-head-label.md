# 2026-09-30 — 0.382.0: Turn message heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Turn message heading accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.382.0
- Implementation commit(s): 77fe90b
- PR: #704

## Changes and relevant files

- See feature PR #704.
- Package 0.382.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #704; live-installed on 192.168.1.20 (0.382.0 / 77fe90bdf82f2e19c23df610fa35cad2d159b979).
- Archive SHA-256: `b04c9f6a634c27a114014b78e5ef93aa90d9c44c0372fb7ae7337ab9f7a3e8a2`
- Revision: `77fe90bdf82f2e19c23df610fa35cad2d159b979`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #704.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #704 and live-installed 0.382.0.
2. Continue a11y form labels.
