# 2026-09-30 — 0.256.0: Conversation actions menu accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversation actions menu panel exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.256.0
- Branch and base: `feat/gui-menu-panel-label` on `main` (0.255.0)
- Implementation commit(s): f6cecd9
- PR: #453

## Changes and relevant files

- Conversation `.menu-panel` sets `role="group"` and `aria-label="Conversation actions"`.
- Package 0.256.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #453; live-installed on 192.168.1.20 (0.256.0 / f6cecd9ba5bceddc3324e80931be77db486dcdec).
- Archive SHA-256: `4a23f45c8f75055ee7f0019dd6d0d2b64626af9e09823cb369f53e3489ce266e`
- Revision: `f6cecd9ba5bceddc3324e80931be77db486dcdec`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.255.0 / revert of #453.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #453 and live-installed 0.256.0.
2. Label agent picker panel next.
