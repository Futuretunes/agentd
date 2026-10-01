# 2026-09-30 — 0.497.0: History pagination focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History pagination focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.497.0
- Implementation commit(s): 3a1df8b
- PR: #929

## Changes and relevant files

- See feature PR #929.
- Package 0.497.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #929; live-installed on 192.168.1.20 (0.497.0 / 3a1df8b60b80a4ba7e9dbb3741601631c38fe47a).
- Archive SHA-256: `72a68a5f2e74261bbe3488d759d2c728f884ec0a54b578db304e3b5c2f8499e5`
- Revision: `3a1df8b60b80a4ba7e9dbb3741601631c38fe47a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #929.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #929 and live-installed 0.497.0.
2. Continue a11y form labels.
