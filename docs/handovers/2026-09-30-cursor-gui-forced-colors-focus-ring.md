# 2026-09-30 — 0.523.0: Forced-colors focus ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Forced-colors focus ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.523.0
- Implementation commit(s): 5c2f370
- PR: #981

## Changes and relevant files

- See feature PR #981.
- Package 0.523.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #981; live-installed on 192.168.1.20 (0.523.0 / 5c2f3701afd6d8a5bee61d84ca0edd9fb2ec371c).
- Archive SHA-256: `2ecf22f4cb226d6e0b22892986e2bf25b827c7d52de7b5b78d88893bf42dd8dc`
- Revision: `5c2f3701afd6d8a5bee61d84ca0edd9fb2ec371c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #981.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #981 and live-installed 0.523.0.
2. Continue a11y form labels.
