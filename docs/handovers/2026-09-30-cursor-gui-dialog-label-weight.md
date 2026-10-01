# 2026-09-30 — 0.407.0: Dialog muted text weight (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog muted text weight
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.407.0
- Implementation commit(s): 07ac1f2
- PR: #754

## Changes and relevant files

- See feature PR #754.
- Package 0.407.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #754; live-installed on 192.168.1.20 (0.407.0 / 07ac1f2088f528778a1ce932d472391ccc4c45a6).
- Archive SHA-256: `f2e05e068d954484ffc5dfce82aa90796dbca3137262faf882d0571aacb85ff3`
- Revision: `07ac1f2088f528778a1ce932d472391ccc4c45a6`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #754.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #754 and live-installed 0.407.0.
2. Continue a11y form labels.
