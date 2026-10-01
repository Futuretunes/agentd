# 2026-09-30 — 0.363.0: Adapter policy form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Adapter policy form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.363.0
- Implementation commit(s): 5e94cee
- PR: #667

## Changes and relevant files

- See feature PR #667.
- Package 0.363.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #667; live-installed on 192.168.1.20 (0.363.0 / 5e94cee7b1ab2718f302eb882151f4c86d166eeb).
- Archive SHA-256: `2cc9d8446b0196c5200c452cb1eee9e90b586d1e9b6fb98bbe43c4481ef2a5b9`
- Revision: `5e94cee7b1ab2718f302eb882151f4c86d166eeb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #667.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #667 and live-installed 0.363.0.
2. Continue a11y form labels.
