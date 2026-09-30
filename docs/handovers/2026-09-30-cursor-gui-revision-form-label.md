# 2026-09-30 — 0.166.0: Request revisions form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Request-revisions form must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.166.0
- Branch and base: `feat/gui-revision-form-label` on `main` (0.165.0)
- Implementation commit(s): 39300bf
- PR: #273

## Changes and relevant files

- `#revision-form` aria-label "Request revisions".
- Package 0.166.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #273; live-installed on 192.168.1.20 (0.166.0 / 39300bf).
- Archive SHA-256: `0c47d803ccb3bccf7f711a54ca0884c2961aceeef3e0d5cd6759b65b19b57a63`
- Revision: `39300bf7465fb6054c759f09a644d7cd58514578`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.165.0 / revert of #273.

## Constraints and known issues

- Complements revision-status live region.

## Next steps

1. Done: merged #273 and live-installed 0.166.0.
2. Continue UX polish or admin slices as operator priority allows.
