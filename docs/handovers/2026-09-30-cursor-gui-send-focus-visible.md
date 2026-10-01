# 2026-09-30 — 0.513.0: Send control focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Send control focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.513.0
- Implementation commit(s): 90e9f9e
- PR: #961

## Changes and relevant files

- See feature PR #961.
- Package 0.513.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #961; live-installed on 192.168.1.20 (0.513.0 / 90e9f9e00b904f3b983eaf4327a8fd72f29aad16).
- Archive SHA-256: `a96626e96085bce38e4306ad151b7ba6811394ae227cd7dd6ee3a9105eb213c9`
- Revision: `90e9f9e00b904f3b983eaf4327a8fd72f29aad16`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #961.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #961 and live-installed 0.513.0.
2. Continue a11y form labels.
