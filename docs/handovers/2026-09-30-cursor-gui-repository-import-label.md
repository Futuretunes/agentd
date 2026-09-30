# 2026-09-30 — 0.165.0: Import repository form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub import confirmation form must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.165.0
- Branch and base: `feat/gui-repository-import-label` on `main` (0.164.0)
- Implementation commit(s): be8c4a6
- PR: #271

## Changes and relevant files

- `#repository-import` aria-label "Import repository".
- Package 0.165.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #271; live-installed on 192.168.1.20 (0.165.0 / be8c4a6).
- Archive SHA-256: `cde202cedaf89a7bd14b4ab7ad81c8288598beb0eec1edc490b2050cb7d032b5`
- Revision: `be8c4a6f247d653297a83defb89723ae77d5378f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.164.0 / revert of #271.

## Constraints and known issues

- Complements Find GitHub repository form label.

## Next steps

1. Done: merged #271 and live-installed 0.165.0.
2. Continue UX polish or admin slices as operator priority allows.
