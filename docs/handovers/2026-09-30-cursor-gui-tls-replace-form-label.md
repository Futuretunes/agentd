# 2026-09-30 — 0.361.0: Replace managed TLS certificate form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Replace managed TLS certificate form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.361.0
- Implementation commit(s): 12e41c6
- PR: #663

## Changes and relevant files

- See feature PR #663.
- Package 0.361.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #663; live-installed on 192.168.1.20 (0.361.0 / 12e41c642933685c01a9862864b4916fc89d2480).
- Archive SHA-256: `b0b442b901e1562e8a0024a34598cf1b7338d6b782ac8687d578fcbe04a99bbf`
- Revision: `12e41c642933685c01a9862864b4916fc89d2480`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #663.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #663 and live-installed 0.361.0.
2. Continue a11y form labels.
