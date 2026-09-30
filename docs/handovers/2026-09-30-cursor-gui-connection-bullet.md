# 2026-09-30 — 0.112.0: Connection bullet + login focus (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Connection status must not announce a decorative bullet; login returns focus to the access key
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.112.0
- Branch and base: `feat/gui-connection-bullet` on `main` (0.111.0)
- Implementation commit(s): 7d1f9f5
- PR: #165

## Changes and relevant files

- Connection ● is `aria-hidden`; spoken text remains “Connected to your workspace”.
- Access key input has `autofocus`; logout and 401 paths call `$("key").focus()`.
- Package 0.112.0; HTML assertions in `test/ui.test.mjs`.

## Validation evidence

- CI green on #165; live-installed on 192.168.1.20 (0.112.0 / 2a1cafb).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.111.0 / revert of #165.

## Constraints and known issues

- Autofocus only applies on first paint; returning from the workspace relies on explicit `.focus()`.

## Next steps

1. Done: merged #165 and live-installed 0.112.0.
2. Continue UX polish or admin slices as operator priority allows.
