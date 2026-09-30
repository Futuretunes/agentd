# 2026-09-30 — 0.241.0: Agent settings content accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent settings content exposes a stable accessible name and announces politely
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.241.0
- Branch and base: `feat/gui-settings-content-label` on `main` (0.240.0)
- Implementation commit(s): 835bed2
- PR: #423

## Changes and relevant files

- `#settings-content` sets `aria-label="Agent settings"` and `aria-live="polite"`.
- Package 0.241.0; source assertion in `test/ui.test.mjs` also locks Settings scope/agent names.

## Validation evidence

- CI green on #423; live-installed on 192.168.1.20 (0.241.0 / 835bed2629633ad98c9d67dc86365ceb2d7e9b7b).
- Archive SHA-256: `05911e9d513e4f5ace9a9ebb0fdb0e8a99456bafd923977ee361b1c97a32ae36`
- Revision: `835bed2629633ad98c9d67dc86365ceb2d7e9b7b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.240.0 / revert of #423.

## Constraints and known issues

None beyond ordinary accessible naming and polite live regions.

## Next steps

1. Done: merged #423 and live-installed 0.241.0.
2. Lock GitHub access ceiling accessible name next.
