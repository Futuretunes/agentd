# 2026-09-30 — 0.295.0: Rollback preview accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Rollback preview exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.295.0
- Branch and base: `feat/gui-rollback-preview-label` on `main` (0.294.0)
- Implementation commit(s): 5cd8e0d
- PR: #531

## Changes and relevant files

- Rollback preview sets `aria-label="Rollback preview"` and `aria-live="polite"`.
- Package 0.295.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #531; live-installed on 192.168.1.20 (0.295.0 / 5cd8e0d2173e5b91cb0fac5778e68ffb48390dfa).
- Archive SHA-256: `34fe9872f7e43dd36a4a6b992b6e142069a484262b695396db05cab15afc106b`
- Revision: `5cd8e0d2173e5b91cb0fac5778e68ffb48390dfa`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.294.0 / revert of #531.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #531 and live-installed 0.295.0.
2. Label turn actions next.
