# 2026-09-30 — 0.453.0: Conversations list focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Conversations list focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.453.0
- Implementation commit(s): 91728cb
- PR: #844

## Changes and relevant files

- See feature PR #844.
- Package 0.453.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #844; live-installed on 192.168.1.20 (0.453.0 / 91728cb26cb170666324f21ef7384e76ad9b194b).
- Archive SHA-256: `20ffad78e712059f33bfc10f331c55d4b572fb6c0d9d07019f3f52e1be394749`
- Revision: `91728cb26cb170666324f21ef7384e76ad9b194b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #844.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #844 and live-installed 0.453.0.
2. Continue a11y form labels.
