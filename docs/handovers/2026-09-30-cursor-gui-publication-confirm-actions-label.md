# 2026-09-30 — 0.285.0: Confirm publication actions accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Confirm publication actions group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.285.0
- Branch and base: `feat/gui-publication-confirm-actions-label` on `main` (0.284.0)
- Implementation commit(s): efee4aa
- PR: #511

## Changes and relevant files

- Confirm publication form `.actions` sets `role="group"` and `aria-label="Confirm publication actions"`.
- Package 0.285.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #511; live-installed on 192.168.1.20 (0.285.0 / efee4aac29f6ea94b2dab6c85b2da6bf1f693c83).
- Archive SHA-256: `c97e7fc64e8d201e0bfcd42cf1e0949675fde4dbd775f643816d9fd400963883`
- Revision: `efee4aac29f6ea94b2dab6c85b2da6bf1f693c83`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.284.0 / revert of #511.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #511 and live-installed 0.285.0.
2. Label History filter actions group next.
