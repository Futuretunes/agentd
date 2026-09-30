# 2026-09-30 — 0.235.0: Agent select accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent select exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.235.0
- Branch and base: `feat/gui-adapter-label` on `main` (0.234.0)
- Implementation commit(s): 7a5f155
- PR: #411

## Changes and relevant files

- `#adapter` keeps visible Agent label and sets `aria-label="Agent"`.
- Package 0.235.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #411; live-installed on 192.168.1.20 (0.235.0 / 7a5f1551dc0ec8a057363f51183e40002bd50938).
- Archive SHA-256: `6d70bd0fe47976fed9737497d4dbf9f73d7dd93568cca9d50926ab929da6a4cd`
- Revision: `7a5f1551dc0ec8a057363f51183e40002bd50938`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.234.0 / revert of #411.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #411 and live-installed 0.235.0.
2. Label sign-in access key input next.
