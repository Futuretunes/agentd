# 2026-09-30 — 0.299.0: Adapter account actions accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Adapter account actions expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.299.0
- Branch and base: `feat/gui-adapter-account-actions-label` on `main` (0.298.0)
- Implementation commit(s): 261dd77
- PR: #539

## Changes and relevant files

- Adapter account `.actions` sets `role="group"` and `aria-label="Adapter account actions"`.
- Package 0.299.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #539; live-installed on 192.168.1.20 (0.299.0 / 261dd77c1cbea0ba7d587249bd4b962b79308f93).
- Archive SHA-256: `5b3ff395f03f8eda96b6f1316b4ef6319c59c1783134c18d85d4dec42ee2bdf2`
- Revision: `261dd77c1cbea0ba7d587249bd4b962b79308f93`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.298.0 / revert of #539.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #539 and live-installed 0.299.0.
2. Label Activity summary next.
