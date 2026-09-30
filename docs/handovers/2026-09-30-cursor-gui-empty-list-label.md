# 2026-09-30 — 0.251.0: Empty list copy accessible names (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Empty conversation and project list copy are labeled
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.251.0
- Branch and base: `feat/gui-empty-list-label` on `main` (0.250.0)
- Implementation commit(s): cb9da64
- PR: #443

## Changes and relevant files

- Empty conversation list copy sets `aria-label="Empty conversations"`.
- Empty project list copy sets `aria-label="Empty projects"`.
- Package 0.251.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #443; live-installed on 192.168.1.20 (0.251.0 / cb9da64dde379facc5d5f0048f82e8091b504f16).
- Archive SHA-256: `78d8185aa8aa60052839e25be083783bce02bd4cfc521a8057a1a888ffecedda`
- Revision: `cb9da64dde379facc5d5f0048f82e8091b504f16`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.250.0 / revert of #443.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #443 and live-installed 0.251.0.
2. Label conversation title next.
