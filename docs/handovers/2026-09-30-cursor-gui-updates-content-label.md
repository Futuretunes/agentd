# 2026-09-30 — 0.177.0: Updates panel content accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Updates dialog content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.177.0
- Branch and base: `feat/gui-updates-content-label` on `main` (0.176.0)
- Implementation commit(s): fc0948e
- PR: #295

## Changes and relevant files

- `#updates-content` aria-label "Updates" (keeps aria-live polite).
- Package 0.177.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #295; live-installed on 192.168.1.20 (0.177.0 / fc0948e).
- Archive SHA-256: `22ab4076a38bf9a61e1d42fa866bce3895577edbbaa6092758dbe35ebfefb0fe`
- Revision: `fc0948e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.176.0 / revert of #295.

## Constraints and known issues

- Complements Updates dialog heading.

## Next steps

1. Done: merged #295 and live-installed 0.177.0.
2. Continue UX polish or admin slices as operator priority allows.
