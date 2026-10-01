# 2026-09-30 — 0.429.0: Updates dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Updates dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.429.0
- Implementation commit(s): c464c59
- PR: #797

## Changes and relevant files

- See feature PR #797.
- Package 0.429.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #797; live-installed on 192.168.1.20 (0.429.0 / c464c5972dedf22788a27140e8339926da722bb1).
- Archive SHA-256: `5849c5765472343de6fce7ac096a45393697187e6131c322995b13f58e1af299`
- Revision: `c464c5972dedf22788a27140e8339926da722bb1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #797.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #797 and live-installed 0.429.0.
2. Continue a11y form labels.
