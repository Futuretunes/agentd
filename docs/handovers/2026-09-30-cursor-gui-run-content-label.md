# 2026-09-30 — 0.185.0: Run activity content accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Run activity dialog content must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.185.0
- Branch and base: `feat/gui-run-content-label` on `main` (0.184.0)
- Implementation commit(s): e8f2adb
- PR: #311

## Changes and relevant files

- `#run-content` aria-label "Run activity" (keeps aria-live polite).
- Package 0.185.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #311; live-installed on 192.168.1.20 (0.185.0 / e8f2adb).
- Archive SHA-256: `7a6f8e769a22b4e2994cbabad7bbf2aa08067d26e59ce19d278accfcbf76ab6c`
- Revision: `e8f2adb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.184.0 / revert of #311.

## Constraints and known issues

- Complements Run activity dialog heading.

## Next steps

1. Done: merged #311 and live-installed 0.185.0.
2. Continue UX polish or admin slices as operator priority allows.
