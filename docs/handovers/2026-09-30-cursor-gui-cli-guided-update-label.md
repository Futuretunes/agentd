# 2026-09-30 — 0.323.0: Guided CLI update accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Guided CLI update section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.323.0
- Branch and base: `feat/gui-cli-guided-update-label` on `main` (0.322.0)
- Implementation commit(s): 2bbb8ca
- PR: #587

## Changes and relevant files

- Guided CLI update section sets `aria-label="Guided CLI update"`.
- Package 0.323.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #587; live-installed on 192.168.1.20 (0.323.0 / 2bbb8cabbac0c3660f022f5fdc9da7dba642c81c).
- Archive SHA-256: `690afe92163fc5a2b7cf60200d054ce7c6b2f2e3f835d2daa923a77293d0e1f4`
- Revision: `2bbb8cabbac0c3660f022f5fdc9da7dba642c81c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.322.0 / revert of #587.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #587 and live-installed 0.323.0.
2. Label Updates Roll back next.
