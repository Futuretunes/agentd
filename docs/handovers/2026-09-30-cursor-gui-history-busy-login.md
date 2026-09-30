# 2026-09-30 — 0.120.0: History busy state + login description (UX-2 / U19)

- Author/agent: Cursor
- Requested outcome: History search should announce loading; login form should describe itself; New project name field autofocuses
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.120.0
- Branch and base: `feat/gui-history-busy-login` on `main` (0.119.0)
- Implementation commit(s): 3699234
- PR: #181

## Changes and relevant files

- `#history-results` is `aria-live="polite"` and toggles `aria-busy` while searching.
- Login form uses `aria-describedby="login-blurb"`.
- `#project-input` has `autofocus`.
- Package 0.120.0; assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #181; live-installed on 192.168.1.20 (0.120.0).

- `node --test test/ui.test.mjs`
- `npm run format:check`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.119.0 / revert of #181.

## Constraints and known issues

- Stale searches that lose the race leave the next open cycle to clear busy.

## Next steps

1. Done: merged #181 and live-installed 0.120.0.
2. Continue UX polish or admin slices as operator priority allows.
