# 2026-09-30 — 0.180.0: Configuration panel accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration dialog content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.180.0
- Branch and base: `feat/gui-configuration-content-label` on `main` (0.179.0)
- Implementation commit(s): 918aa58
- PR: #301

## Changes and relevant files

- `#configuration-content` aria-label "Configuration" (keeps aria-live polite).
- Package 0.180.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #301; live-installed on 192.168.1.20 (0.180.0 / 918aa58).
- Archive SHA-256: `29faffd20cca2999e4f021837cf1f9ff103881b83d7c78c2fcdbac012b49a8ce`
- Revision: `918aa58`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.179.0 / revert of #301.

## Constraints and known issues

- Complements Configuration dialog heading.

## Next steps

1. Done: merged #301 and live-installed 0.180.0.
2. Continue UX polish or admin slices as operator priority allows.
