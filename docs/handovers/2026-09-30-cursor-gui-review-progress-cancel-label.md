# 2026-09-30 — 0.459.0: Review progress cancel accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review progress cancel accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.459.0
- Implementation commit(s): ce71548
- PR: #856

## Changes and relevant files

- See feature PR #856.
- Package 0.459.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #856; live-installed on 192.168.1.20 (0.459.0 / ce715485bce02601d382f3f3b9b60cd1933a73d3).
- Archive SHA-256: `737c9229158a56ff301e73190844671c70cc3fdd656b282e8e99797fecdb62a9`
- Revision: `ce715485bce02601d382f3f3b9b60cd1933a73d3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #856.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #856 and live-installed 0.459.0.
2. Continue a11y form labels.
