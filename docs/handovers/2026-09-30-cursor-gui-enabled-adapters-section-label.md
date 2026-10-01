# 2026-09-30 — 0.332.0: Enabled adapters accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Enabled adapters form section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.332.0
- Branch and base: `feat/gui-enabled-adapters-section-label` on `main` (0.331.0)
- Implementation commit(s): 6f55cf6
- PR: #605

## Changes and relevant files

- Enabled adapters form section sets `aria-label="Enabled adapters"`.
- Package 0.332.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #605; live-installed on 192.168.1.20 (0.332.0 / 6f55cf668b516aade5321510afd1a8429d6e3bf3).
- Archive SHA-256: `85c695adf811a612a992bd5ca697c1c076c8e4c32f3bf28bd24d05965da480e9`
- Revision: `6f55cf668b516aade5321510afd1a8429d6e3bf3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.331.0 / revert of #605.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #605 and live-installed 0.332.0.
2. Label Edit permissions next.
