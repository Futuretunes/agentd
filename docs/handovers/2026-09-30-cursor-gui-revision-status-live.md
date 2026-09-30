# 2026-09-30 — 0.163.0: Polite live revision status (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Request-revisions status must announce politely in addition to role=status
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.163.0
- Branch and base: `feat/gui-revision-status-live` on `main` (0.162.0)
- Implementation commit(s): eb39f0a
- PR: #267

## Changes and relevant files

- `#revision-status` sets `aria-live="polite"` alongside `role="status"`.
- Package 0.163.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #267; live-installed on 192.168.1.20 (0.163.0 / eb39f0a).
- Archive SHA-256: `fa115a04191cc3aca7547501a691242057f0fa8c5d63dea093284a1ce41ef9e5`
- Revision: `eb39f0af3a2c95299bdb47b6aae11a23e79c84a9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.162.0 / revert of #267.

## Constraints and known issues

- Complements page notice toast live region (0.156.0).

## Next steps

1. Done: merged #267 and live-installed 0.163.0.
2. Continue UX polish or admin slices as operator priority allows.
