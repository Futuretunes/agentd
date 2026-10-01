# 2026-09-30 — 0.501.0: Agent reasons focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent reasons focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.501.0
- Implementation commit(s): 7484099
- PR: #937

## Changes and relevant files

- See feature PR #937.
- Package 0.501.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #937; live-installed on 192.168.1.20 (0.501.0 / 7484099084a191dcd277352a4c5457726eacdac7).
- Archive SHA-256: `0b0ac592cac46e9d483826e3683294bffca151754b994e08da4b7e5fd88123dd`
- Revision: `7484099084a191dcd277352a4c5457726eacdac7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #937.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #937 and live-installed 0.501.0.
2. Continue a11y form labels.
