# 2026-09-30 — 0.169.0: Sign-in form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sign-in form must expose a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.169.0
- Branch and base: `feat/gui-login-form-label` on `main` (0.168.0)
- Implementation commit(s): fc3cb26
- PR: #279

## Changes and relevant files

- `#loginform` aria-label "Sign in" (keeps aria-describedby login-blurb).
- Package 0.169.0; assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #279; live-installed on 192.168.1.20 (0.169.0 / fc3cb26).
- Archive SHA-256: `7650d4c0970808263d2b84b6c36971819d1a6959feb7d994993492a8d17b743b`
- Revision: `fc3cb26ce635d36442d6a29be08bf35666dd7189`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.168.0 / revert of #279.

## Constraints and known issues

- Complements login landmark and access-key autofocus.

## Next steps

1. Done: merged #279 and live-installed 0.169.0.
2. Continue UX polish or admin slices as operator priority allows.
