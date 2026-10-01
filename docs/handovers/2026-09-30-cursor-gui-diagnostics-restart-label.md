# 2026-09-30 — 0.319.0: Restart services accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics Restart services section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.319.0
- Branch and base: `feat/gui-diagnostics-restart-label` on `main` (0.318.0)
- Implementation commit(s): 405e133
- PR: #579

## Changes and relevant files

- Diagnostics Restart services section sets `aria-label="Restart services"`.
- Package 0.319.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #579; live-installed on 192.168.1.20 (0.319.0 / 405e1333660850f7ec25e035ee6b800795ed788c).
- Archive SHA-256: `302708f7603b34960604c0fcd6928794af33783a1ae09032170689daf8c03c18`
- Revision: `405e1333660850f7ec25e035ee6b800795ed788c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.318.0 / revert of #579.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #579 and live-installed 0.319.0.
2. Label Recent failed runs next.
