# 2026-09-30 — 0.195.0: Phone drawer right safe-area (UX-4 / U16)

- Author/agent: Cursor
- Requested outcome: Phone navigation drawer must clear the right safe-area inset
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.195.0
- Branch and base: `feat/gui-drawer-safe-area-right` on `main` (0.194.0)
- Implementation commit(s): 1364d09
- PR: #331

## Changes and relevant files

- Phone `#sidebar` sets `padding-right: max(0px, env(safe-area-inset-right))`.
- Package 0.195.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #331; live-installed on 192.168.1.20 (0.195.0 / 1364d09).
- Archive SHA-256: `63fd6ac9aa451e6c819b2ce8f30b8829b621883e2e1c6846b2af951733bdfe14`
- Revision: `1364d09`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.194.0 / revert of #331.

## Constraints and known issues

- Complements drawer left/top/bottom safe-area insets.

## Next steps

1. Done: merged #331 and live-installed 0.195.0.
2. Continue remaining a11y labeling polish.
