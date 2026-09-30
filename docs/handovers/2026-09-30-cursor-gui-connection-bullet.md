# 2026-09-30 — 0.112.0: Connection bullet + login focus (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Connection status must not announce a decorative bullet; login returns focus to the access key
- Status: implemented
- Release: 0.112.0
- Branch and base: `feat/gui-connection-bullet` on `main` (0.111.0)
- Implementation commit(s): 7d1f9f5
- PR: #165

## Changes and relevant files

- Connection ● is `aria-hidden`; spoken text remains “Connected to your workspace”.
- Access key input has `autofocus`; logout and 401 paths call `$("key").focus()`.
- Package 0.112.0; HTML assertions in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Autofocus only applies on first paint; returning from the workspace relies on explicit `.focus()`.

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
