# 2026-09-30 — 0.247.0: Dynamic field-label muted styling (UX-5 / U17)

- Author/agent: Cursor
- Requested outcome: Dynamic field labels use muted dialog-label styling
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.247.0
- Branch and base: `feat/gui-field-label-muted` on `main` (0.246.0)
- Implementation commit(s): 2387a5c
- PR: #435

## Changes and relevant files

- `.field-label` uses muted color and compact spacing matching dialog labels.
- Package 0.247.0; CSS assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #435; live-installed on 192.168.1.20 (0.247.0 / 2387a5c1198098a3de154f35e5a55e70242a3a60).
- Archive SHA-256: `28619695a038fde7d4bfa326c45356c72b0365a97c812df0f41313b44c8403be`
- Revision: `2387a5c1198098a3de154f35e5a55e70242a3a60`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.246.0 / revert of #435.

## Constraints and known issues

None beyond ordinary visual consistency.

## Next steps

1. Done: merged #435 and live-installed 0.247.0.
2. Lock feedback-comment select accessible-name pattern next.
