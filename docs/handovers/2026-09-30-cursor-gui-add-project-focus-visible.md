# 2026-09-30 — 0.517.0: Add project focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Add project focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.517.0
- Implementation commit(s): a2e3952
- PR: #969

## Changes and relevant files

- See feature PR #969.
- Package 0.517.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #969; live-installed on 192.168.1.20 (0.517.0 / a2e39527dd86a9ff8f6ac47feccd4e321f6020e0).
- Archive SHA-256: `1b4bae83d8118a031c8366f3025abfa8bde2c4ff561c07d6403307f30a0e726e`
- Revision: `a2e39527dd86a9ff8f6ac47feccd4e321f6020e0`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #969.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #969 and live-installed 0.517.0.
2. Continue a11y form labels.
