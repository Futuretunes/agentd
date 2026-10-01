# 2026-09-30 — 0.324.0: Updates Roll back accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Updates Roll back section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.324.0
- Branch and base: `feat/gui-updates-rollback-section-label` on `main` (0.323.0)
- Implementation commit(s): 97c69c2
- PR: #589

## Changes and relevant files

- Updates Roll back section sets `aria-label="Roll back"`.
- Package 0.324.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #589; live-installed on 192.168.1.20 (0.324.0 / 97c69c27182578e128c9c1d88dc90a9e45c898dd).
- Archive SHA-256: `88924f6bff11da2edc898647d88af53715eed51a7faad7bf3da7bca969281858`
- Revision: `97c69c27182578e128c9c1d88dc90a9e45c898dd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.323.0 / revert of #589.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #589 and live-installed 0.324.0.
2. Label available update cards next.
