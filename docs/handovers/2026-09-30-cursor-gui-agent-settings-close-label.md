# 2026-09-30 — 0.292.0: Agent settings close accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent settings close control exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.292.0
- Branch and base: `feat/gui-agent-settings-close-label` on `main` (0.291.0)
- Implementation commit(s): 8f57410
- PR: #525

## Changes and relevant files

- Agent settings close control sets `aria-label="Close agent settings"`.
- Package 0.292.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #525; live-installed on 192.168.1.20 (0.292.0 / 8f57410132468856eaece8751c801777b3b76721).
- Archive SHA-256: `5b9aa0de343e431990338af67c7f6c48d5b0de52a6489034fd49fe7dc269f28f`
- Revision: `8f57410132468856eaece8751c801777b3b76721`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.291.0 / revert of #525.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #525 and live-installed 0.292.0.
2. Label storage cleanup preview next.
