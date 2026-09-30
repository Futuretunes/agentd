# 2026-09-30 — 0.203.0: Picker summary accessible name (UX-2 / U2)

- Author/agent: Cursor
- Requested outcome: Collapsed picker agent tag must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.203.0
- Branch and base: `feat/gui-picker-summary-label` on `main` (0.202.0)
- Implementation commit(s): 85f008b
- PR: #347

## Changes and relevant files

- `#picker-summary` sets `aria-label="Selected agent"`.
- Package 0.203.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #347; live-installed on 192.168.1.20 (0.203.0 / 85f008b).
- Archive SHA-256: `5c89ae56c5e89eb4973208905b0a4fc53b358a6412af3707c537c9560a3e3a03`
- Revision: `85f008b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.202.0 / revert of #347.

## Constraints and known issues

- Complements polite live announcements on the same element (0.145.0).

## Next steps

1. Done: merged #347 and live-installed 0.203.0.
2. Label picker mode tag next.
