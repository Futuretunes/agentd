# 2026-09-30 — 0.164.0: GitHub repository form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Find GitHub repository form must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.164.0
- Branch and base: `feat/gui-repository-form-label` on `main` (0.163.0)
- Implementation commit(s): 0bc509c
- PR: #269

## Changes and relevant files

- `#repository-form` aria-label "Find GitHub repository".
- Package 0.164.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #269; live-installed on 192.168.1.20 (0.164.0 / 0bc509c).
- Archive SHA-256: `c3ab730c99393b41763bdc44f89d7bc6eb6d0f03d2576609ef68c72ebddb3555`
- Revision: `0bc509c3f9437d91bfe0df4d5b201af59c490823`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.163.0 / revert of #269.

## Constraints and known issues

- Complements Create project form label.

## Next steps

1. Done: merged #269 and live-installed 0.164.0.
2. Continue UX polish or admin slices as operator priority allows.
