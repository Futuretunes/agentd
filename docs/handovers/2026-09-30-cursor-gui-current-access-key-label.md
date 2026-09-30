# 2026-09-30 — 0.240.0: Current access key accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Current access key confirmation input exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.240.0
- Branch and base: `feat/gui-current-access-key-label` on `main` (0.239.0)
- Implementation commit(s): 9e173c5
- PR: #421

## Changes and relevant files

- Access-key change confirmation field sets `aria-label="Current access key"` beside the existing New access key name.
- Package 0.240.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #421; live-installed on 192.168.1.20 (0.240.0 / 9e173c5be2d54f0efd5b07aeb289996561ce3761).
- Archive SHA-256: `e45fe8f971939ba3342228cdb6dc63bb7bd92ab0835887b443b112b109ea169b`
- Revision: `9e173c5be2d54f0efd5b07aeb289996561ce3761`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.239.0 / revert of #421.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #421 and live-installed 0.240.0.
2. Label settings content / scope next.
