# 2026-09-30 — 0.290.0: Account dialog content accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Account dialog content exposes a stable accessible name and polite live updates
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.290.0
- Branch and base: `feat/gui-account-content-label` on `main` (0.289.0)
- Implementation commit(s): 93a9f36
- PR: #521

## Changes and relevant files

- Account dialog content sets `aria-label="Account connection"` and `aria-live="polite"`.
- Package 0.290.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #521; live-installed on 192.168.1.20 (0.290.0 / 93a9f36cf83abb0e3d3eb16f98aca2a314c71bca).
- Archive SHA-256: `589013313169544a41240dbeef64e81947a903f98af326cee7af141e7e0ed3d7`
- Revision: `93a9f36cf83abb0e3d3eb16f98aca2a314c71bca`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.289.0 / revert of #521.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #521 and live-installed 0.290.0.
2. Label Agent settings form next.
