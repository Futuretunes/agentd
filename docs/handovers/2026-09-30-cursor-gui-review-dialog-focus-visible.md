# 2026-09-30 — 0.424.0: Review dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.424.0
- Implementation commit(s): 8c8cb15
- PR: #788

## Changes and relevant files

- See feature PR #788.
- Package 0.424.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #788; live-installed on 192.168.1.20 (0.424.0 / 8c8cb153c29aa6a1f21e0d35702a1441f64636e0).
- Archive SHA-256: `ad4c2e7a2bd9e8968d9b851e83453e7c5017df0bd7046843b04c3f57c6c21500`
- Revision: `8c8cb153c29aa6a1f21e0d35702a1441f64636e0`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #788.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #788 and live-installed 0.424.0.
2. Continue a11y form labels.
