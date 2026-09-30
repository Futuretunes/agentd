# 2026-09-30 — 0.284.0: Request revisions actions accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Request revisions actions group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.284.0
- Branch and base: `feat/gui-revision-actions-label` on `main` (0.283.0)
- Implementation commit(s): 27a547a
- PR: #509

## Changes and relevant files

- Request revisions form `.actions` sets `role="group"` and `aria-label="Request revisions actions"`.
- Package 0.284.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #509; live-installed on 192.168.1.20 (0.284.0 / 27a547a61999fe1e465620d35a4cd0439ca1ee49).
- Archive SHA-256: `85a9f351322886c1fa97206ab5ecf9245c1b68a4065160f3e9dbd0b7d7d56240`
- Revision: `27a547a61999fe1e465620d35a4cd0439ca1ee49`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.283.0 / revert of #509.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #509 and live-installed 0.284.0.
2. Label Confirm publication actions group next.
