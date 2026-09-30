# 2026-09-30 — 0.110.0: Notice roles for errors vs info (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Transient page/dialog notices expose alert for errors and status for confirmations
- Status: implemented
- Release: 0.110.0
- Branch and base: `feat/gui-notice-role` on `main` (0.109.0)
- Implementation commit(s): 672adae
- PR: #161

## Changes and relevant files

- `noticeRole` maps error → `alert`, otherwise `status`.
- `notice()` sets the role on the active page or dialog notice target and resets to status on dismiss.
- Package 0.110.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Not installed. Candidate only. Rollback is revert of the PR / prior package version.

## Constraints and known issues

- Dialog notices already defaulted to `role="alert"` on create; they now follow the same tone mapping.
- Auto-dismiss timings are unchanged (5s info / 8s error).

## Next steps

1. Merge when CI is green; live-install on 192.168.1.20.
2. Continue UX polish or admin slices as operator priority allows.
