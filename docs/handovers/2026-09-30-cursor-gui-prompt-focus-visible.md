# 2026-09-30 — 0.511.0: Composer prompt focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer prompt focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.511.0
- Implementation commit(s): bc28245
- PR: #957

## Changes and relevant files

- See feature PR #957.
- Package 0.511.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #957; live-installed on 192.168.1.20 (0.511.0 / bc28245bcb22016d88ceac66a54c3a2cf99561ec).
- Archive SHA-256: `5323b3cc5fb586e7c652511633980cf19d8ee8d8620945f47b5139c70a3d24a9`
- Revision: `bc28245bcb22016d88ceac66a54c3a2cf99561ec`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #957.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #957 and live-installed 0.511.0.
2. Continue a11y form labels.
