# 2026-09-30 — 0.468.0: Activity content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.468.0
- Implementation commit(s): 3e9c40d
- PR: #873

## Changes and relevant files

- See feature PR #873.
- Package 0.468.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #873; live-installed on 192.168.1.20 (0.468.0 / 3e9c40d74e1ce75ddc367322b6e92c31a97fd454).
- Archive SHA-256: `3035309e5674aff79a6ca86acf1809c4f120c5079129544c482139f86257ab03`
- Revision: `3e9c40d74e1ce75ddc367322b6e92c31a97fd454`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #873.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #873 and live-installed 0.468.0.
2. Continue a11y form labels.
