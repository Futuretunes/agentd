# 2026-09-30 — 0.334.0: Update backups accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Update backups section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.334.0
- Branch and base: `feat/gui-update-backups-section-label` on `main` (0.333.0)
- Implementation commit(s): af9abff
- PR: #609

## Changes and relevant files

- Update backups section sets `aria-label="Update backups"`.
- Package 0.334.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #609; live-installed on 192.168.1.20 (0.334.0 / af9abff80e924497c6832bcbedf15c5d8fee5f2d).
- Archive SHA-256: `ce2566627a9dc2930b41ea9eed9d94683e1f13b63939b671ce77f9229b11d691`
- Revision: `af9abff80e924497c6832bcbedf15c5d8fee5f2d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.333.0 / revert of #609.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #609 and live-installed 0.334.0.
2. Label Enable profile form section next.
