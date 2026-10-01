# 2026-09-30 — 0.325.0: Available update card accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Available update cards expose stable accessible names from their release version
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.325.0
- Branch and base: `feat/gui-available-update-card-label` on `main` (0.324.0)
- Implementation commit(s): f3ec95d
- PR: #591

## Changes and relevant files

- Each available update card sets `aria-label=`Available update AgentD ${release.version}``.
- Package 0.325.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #591; live-installed on 192.168.1.20 (0.325.0 / f3ec95de4fb993978a7f04ea21cd95a073bf9675).
- Archive SHA-256: `24c9908959b060749827b43db66ada4f2702ddab352b81b746b3fd6c53d55bf3`
- Revision: `f3ec95de4fb993978a7f04ea21cd95a073bf9675`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.324.0 / revert of #591.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #591 and live-installed 0.325.0.
2. Label approval execution Details next.
