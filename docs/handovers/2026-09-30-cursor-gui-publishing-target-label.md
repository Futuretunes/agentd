# 2026-09-30 — 0.224.0: Publication target accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication target select exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.224.0
- Branch and base: `feat/gui-publishing-target-label` on `main` (0.223.0)
- Implementation commit(s): d2061cf
- PR: #389

## Changes and relevant files

- `#publishing-target` keeps visible Publication label and sets `aria-label="Publication target"`.
- Package 0.224.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #389; live-installed on 192.168.1.20 (0.224.0 / d2061cfa03f72a1882fd3fe238bad2305b1b3bb3).
- Archive SHA-256: `0f0153f327bf4b31a2dd1d03370e3059c28195eded496b39674781820a092bc8`
- Revision: `d2061cfa03f72a1882fd3fe238bad2305b1b3bb3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.223.0 / revert of #389.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #389 and live-installed 0.224.0.
2. Label publishing base branch select next.
