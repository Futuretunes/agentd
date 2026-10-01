# 2026-09-30 — 0.307.0: Large review files accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Large review files section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.307.0
- Branch and base: `feat/gui-large-review-files-label` on `main` (0.306.0)
- Implementation commit(s): d277fea
- PR: #555

## Changes and relevant files

- Large review files section sets `aria-label="Large review files"`.
- Package 0.307.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #555; live-installed on 192.168.1.20 (0.307.0 / d277fea07f4d7d82ce885c784f75626cfd29ec43).
- Archive SHA-256: `c5f5ae2fa8afbffa33a13d88113f2cf788edb89346889417c347d36161992e14`
- Revision: `d277fea07f4d7d82ce885c784f75626cfd29ec43`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.306.0 / revert of #555.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #555 and live-installed 0.307.0.
2. Label paginated review controls next.
