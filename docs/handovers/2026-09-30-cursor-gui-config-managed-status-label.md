# 2026-09-30 — 0.309.0: Managed status accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration Managed status section exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.309.0
- Branch and base: `feat/gui-config-managed-status-label` on `main` (0.308.0)
- Implementation commit(s): 19676c9
- PR: #559

## Changes and relevant files

- Configuration Managed status section sets `aria-label="Managed status"`.
- Package 0.309.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #559; live-installed on 192.168.1.20 (0.309.0 / 19676c9f0d74c2b9205b99998ef16e7f8f130ffa).
- Archive SHA-256: `46235444b6a1764f7f36914fbda9fae742a3a5454debe5e7c223925e0b4211a6`
- Revision: `19676c9f0d74c2b9205b99998ef16e7f8f130ffa`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.308.0 / revert of #559.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #559 and live-installed 0.309.0.
2. Label TLS certificate section next.
