# 2026-09-30 — 0.436.0: Project settings dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Project settings dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.436.0
- Implementation commit(s): c8ae42f
- PR: #811

## Changes and relevant files

- See feature PR #811.
- Package 0.436.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #811; live-installed on 192.168.1.20 (0.436.0 / c8ae42febb5b8a7bd765a4bf117f302cd64b5173).
- Archive SHA-256: `24ba6bda7242419c0936e83a19c5ad383d16727c2906208a92f44e5e0a0e664e`
- Revision: `c8ae42febb5b8a7bd765a4bf117f302cd64b5173`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #811.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #811 and live-installed 0.436.0.
2. Continue a11y form labels.
