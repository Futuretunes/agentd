# 2026-09-30 — 0.249.0: Sign-in guidance accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sign-in guidance blurb exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.249.0
- Branch and base: `feat/gui-login-blurb-label` on `main` (0.248.0)
- Implementation commit(s): 84aec44
- PR: #439

## Changes and relevant files

- `#login-blurb` sets `aria-label="Sign-in guidance"` and remains the login form `aria-describedby` target.
- Package 0.249.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #439; live-installed on 192.168.1.20 (0.249.0 / 84aec449a66d047738020186a09c1eef3d7cae9b).
- Archive SHA-256: `d988784b77bb3e1c1597ae80f2930fe7472a8ca633d96ef1e57897a840ed6df3`
- Revision: `84aec449a66d047738020186a09c1eef3d7cae9b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.248.0 / revert of #439.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #439 and live-installed 0.249.0.
2. Lock review diff line Added/Removed accessible names next.
