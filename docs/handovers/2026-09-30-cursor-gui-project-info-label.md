# 2026-09-30 — 0.172.0: Project information region accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Project settings info region must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.172.0
- Branch and base: `feat/gui-project-info-label` on `main` (0.171.0)
- Implementation commit(s): 37d5678
- PR: #285

## Changes and relevant files

- `#project-info` aria-label "Project information".
- Package 0.172.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #285; live-installed on 192.168.1.20 (0.172.0 / 37d5678).
- Archive SHA-256: `7a0733f4d54c0807cfd4a1823d34bd6130c408ca517938191ee70e4840359ace`
- Revision: `37d5678`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.171.0 / revert of #285.

## Constraints and known issues

- Region remains hidden until Project settings toggles it open.

## Next steps

1. Done: merged #285 and live-installed 0.172.0.
2. Continue UX polish or admin slices as operator priority allows.
