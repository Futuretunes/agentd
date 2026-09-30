# 2026-09-30 — 0.186.0: GitHub feedback results accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub feedback results live region must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.186.0
- Branch and base: `feat/gui-feedback-content-label` on `main` (0.185.0)
- Implementation commit(s): bc646a1
- PR: #313

## Changes and relevant files

- `#feedback-content` aria-label "GitHub feedback results" (keeps aria-live polite).
- Package 0.186.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #313; live-installed on 192.168.1.20 (0.186.0 / bc646a1).
- Archive SHA-256: `d92068f4f9eb160d3bed2940a0a914c2f4d394647e878d3ab90df357382420c4`
- Revision: `bc646a1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.185.0 / revert of #313.

## Constraints and known issues

- Complements GitHub feedback form label.

## Next steps

1. Done: merged #313 and live-installed 0.186.0.
2. Continue UX polish or admin slices as operator priority allows.
