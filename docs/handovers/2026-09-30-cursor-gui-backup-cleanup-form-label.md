# 2026-09-30 — 0.338.0: Backup cleanup form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Backup cleanup form exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.338.0
- Branch and base: `feat/gui-backup-cleanup-form-label` on `main` (0.337.0)
- Implementation commit(s): c82f5a1
- PR: #617

## Changes and relevant files

- Backup cleanup form sets `aria-label="Backup cleanup"`.
- Package 0.338.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #617; live-installed on 192.168.1.20 (0.338.0 / c82f5a1ec0cf209b76519ee40f6af378d80b58df).
- Archive SHA-256: `91fae8f49ad873170626b47440b50bb37a9f5b68ba775f20ba91b1ab1ce437e1`
- Revision: `c82f5a1ec0cf209b76519ee40f6af378d80b58df`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.337.0 / revert of #617.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #617 and live-installed 0.338.0.
2. Label Backup restore form next.
