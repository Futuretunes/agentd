# 2026-09-30 — 0.479.0: Access key content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Access key content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.479.0
- Implementation commit(s): 71f671f
- PR: #894

## Changes and relevant files

- See feature PR #894.
- Package 0.479.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #894; live-installed on 192.168.1.20 (0.479.0 / 71f671f399908b221e38a88c4503187b710da204).
- Archive SHA-256: `014c2a956e746e452bf4d69c65f8d845cc8aa7aab862fc1fe5bd62805c8745ca`
- Revision: `71f671f399908b221e38a88c4503187b710da204`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #894.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #894 and live-installed 0.479.0.
2. Continue a11y form labels.
