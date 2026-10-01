# 2026-09-30 — 0.320.0: Recent failed runs accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics Recent failed runs section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.320.0
- Branch and base: `feat/gui-diagnostics-failures-label` on `main` (0.319.0)
- Implementation commit(s): 846d00e
- PR: #581

## Changes and relevant files

- Diagnostics Recent failed runs section sets `aria-label="Recent failed runs"`.
- Package 0.320.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #581; live-installed on 192.168.1.20 (0.320.0 / 846d00eab263fc3a15682672533c72a48972262d).
- Archive SHA-256: `4b7c32b738e71a3965548c3d2a36a8cc47cf070486783fa4a6b40e3e018bf40b`
- Revision: `846d00eab263fc3a15682672533c72a48972262d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.319.0 / revert of #581.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #581 and live-installed 0.320.0.
2. Label CLI Installed vs tested next.
