# 2026-09-30 — 0.270.0: Publishing dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publishing dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.270.0
- Branch and base: `feat/gui-publishing-head-label` on `main` (0.269.0)
- Implementation commit(s): 6b5d265
- PR: #481

## Changes and relevant files

- Publishing dialog `.review-head` sets `role="group"` and `aria-label="Publishing heading"`.
- Package 0.270.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #481; live-installed on 192.168.1.20 (0.270.0 / 6b5d26592ab7aa272bb76a40b5004db9b6c175b3).
- Archive SHA-256: `0798b507bb3052043817f9b6950e8cad131d620be04b1b2b6ed0ff924bd435a8`
- Revision: `6b5d26592ab7aa272bb76a40b5004db9b6c175b3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.269.0 / revert of #481.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #481 and live-installed 0.270.0.
2. Label feedback dialog heading next.
