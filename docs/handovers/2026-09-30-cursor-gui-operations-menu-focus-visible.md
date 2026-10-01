# 2026-09-30 — 0.545.0: Activity menu focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity menu focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.545.0
- Implementation commit(s): 2eece3b
- PR: #1024

## Changes and relevant files

- See feature PR #1024.
- Package 0.545.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1024; live-installed on 192.168.1.20 (0.545.0 / 2eece3b055057c580c44b9c2ac05ea4fc936bd7e).
- Archive SHA-256: `62752ff375108e8c4f310e849da025bd0e4c21dc8c0ab1d9465c7d89ebfd8f6b`
- Revision: `2eece3b055057c580c44b9c2ac05ea4fc936bd7e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1024.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1024 and live-installed 0.545.0.
2. Continue a11y form labels.
