# 2026-09-30 — 0.322.0: Approved CLI packages accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Approved CLI packages section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.322.0
- Branch and base: `feat/gui-cli-approved-packages-label` on `main` (0.321.0)
- Implementation commit(s): d6c51c7
- PR: #585

## Changes and relevant files

- Approved CLI packages section sets `aria-label="Approved CLI packages"`.
- Package 0.322.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #585; live-installed on 192.168.1.20 (0.322.0 / d6c51c73a36877b367a49aaa968d7d9ab6e72285).
- Archive SHA-256: `f896e2590a271153bb2c3cdef6f5eb9bc9585a62159b4155a730baff73f4e8b9`
- Revision: `d6c51c73a36877b367a49aaa968d7d9ab6e72285`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.321.0 / revert of #585.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #585 and live-installed 0.322.0.
2. Label Guided CLI update next.
