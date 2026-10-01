# 2026-09-30 — 0.387.0: Review checks output accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review checks output accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.387.0
- Implementation commit(s): 6574c92
- PR: #714

## Changes and relevant files

- See feature PR #714.
- Package 0.387.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #714; live-installed on 192.168.1.20 (0.387.0 / 6574c92ec410763ff339babf7cf085024ea59050).
- Archive SHA-256: `f3ab40548b316ef9581a9a6f033bc0ac22c12e08d1cd04dd072753d55d22aad6`
- Revision: `6574c92ec410763ff339babf7cf085024ea59050`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #714.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #714 and live-installed 0.387.0.
2. Continue a11y form labels.
