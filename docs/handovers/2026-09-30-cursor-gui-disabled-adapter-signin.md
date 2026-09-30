# 2026-09-30 — 0.94.0: Honest Sign in for disabled adapters (UX-1 / U10)

- Author/agent: Cursor
- Requested outcome: Operations must not present “Sign in” as the fix for adapters disabled by security policy; Cursor capability notes must not contradict unavailability
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.94.0
- Branch and base: `feat/gui-disabled-adapter-signin` on `main` (0.93.0)
- Implementation commit(s): 4e39fa6
- PR: #129

## Changes and relevant files

- `adapterAccountActionLabel` / `adapterAccountStatusLine` in `public/ui.js`.
- Operations agent cards use “Sign in for later” when installed but not enabled; signed-out disabled adapters stay muted (“Account not signed in”).
- Composer picker Cursor text-only note only when Cursor is available.
- Package 0.94.0; unit coverage in `test/ui.test.mjs`.

## Validation evidence

- CI green on #129; live-installed on 192.168.1.20 (0.94.0 / 5518fd0d53ef).

- `node --test test/ui.test.mjs`
- `npm run typecheck`
- `npm run format:check` (after format)

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.93.0 / revert of #129.

## Constraints and known issues

- Sign-in ahead of enable remains allowed; copy clarifies it only prepares the account.
- Agents settings navigation (UX-2) is unchanged in this slice.

## Next steps

1. Done: merged #129 and live-installed 0.94.0.
2. Continue UX polish or admin slices as operator priority allows.
