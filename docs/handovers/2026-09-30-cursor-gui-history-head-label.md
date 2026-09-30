# 2026-09-30 — 0.264.0: History dialog heading accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History dialog heading group exposes a stable accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.264.0
- Branch and base: `feat/gui-history-head-label` on `main` (0.263.0)
- Implementation commit(s): 7d8e843
- PR: #469

## Changes and relevant files

- History dialog `.review-head` sets `role="group"` and `aria-label="History heading"`.
- Package 0.264.0; HTML assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #469; live-installed on 192.168.1.20 (0.264.0 / 7d8e843c305071e2b80cc084d68b5f5d284f0252).
- Archive SHA-256: `0fe8c97df743f2ec9d89211f39e8b68f0b01029080e6fb4ad4cc6c461afbb713`
- Revision: `7d8e843c305071e2b80cc084d68b5f5d284f0252`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior 0.263.0 / revert of #469.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #469 and live-installed 0.264.0.
2. Label settings dialog heading next.
