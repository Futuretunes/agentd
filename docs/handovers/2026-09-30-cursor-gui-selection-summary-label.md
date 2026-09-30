# 2026-09-30 — 0.201.0: Selection summary accessible name (UX-1 / U2)

- Author/agent: Cursor
- Requested outcome: Model/effort selection summary must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.201.0
- Branch and base: `feat/gui-selection-summary-label` on `main` (0.200.0)
- Implementation commit(s): dc34ebd
- PR: #343

## Changes and relevant files

- `#selection-summary` sets `aria-label="Model and effort"`.
- Package 0.201.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #343; live-installed on 192.168.1.20 (0.201.0 / dc34ebd).
- Archive SHA-256: `feecaf4e0d11705dae1714f11f1e54c2b29c971a6c55162c1b499ad0920a1e0a`
- Revision: `dc34ebd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.200.0 / revert of #343.

## Constraints and known issues

- Complements polite live announcements on the same element (0.144.0).

## Next steps

1. Done: merged #343 and live-installed 0.201.0.
2. Continue remaining a11y labeling polish.
