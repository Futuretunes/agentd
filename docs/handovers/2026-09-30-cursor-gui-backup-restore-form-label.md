# 2026-09-30 — 0.339.0: Backup restore form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Backup restore form exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.339.0
- Branch and base: `feat/gui-backup-restore-form-label` on `main` (0.338.0)
- Implementation commit(s): 3ea3689
- PR: #619

## Changes and relevant files

- Backup restore form sets `aria-label="Backup restore"`.
- Package 0.339.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #619; live-installed on 192.168.1.20 (0.339.0 / 3ea36894d66497e66678d8554456be3afb363215).
- Archive SHA-256: `96dfacfe8db2caa84d1bbee085d4173fb818914a2416938f14466fdfffa54563`
- Revision: `3ea36894d66497e66678d8554456be3afb363215`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.338.0 / revert of #619.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #619 and live-installed 0.339.0.
2. Label Clear ntfy destination form next.
