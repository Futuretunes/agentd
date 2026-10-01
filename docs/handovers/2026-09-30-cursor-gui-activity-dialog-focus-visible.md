# 2026-09-30 — 0.423.0: Activity dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Activity dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.423.0
- Implementation commit(s): 613d48d
- PR: #786

## Changes and relevant files

- See feature PR #786.
- Package 0.423.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #786; live-installed on 192.168.1.20 (0.423.0 / 613d48d75fe096247612c6428d47aae6d4d15034).
- Archive SHA-256: `97fadb58fae4629456a7b78f5c47176704301b46a66658a5752d7d4600605f95`
- Revision: `613d48d75fe096247612c6428d47aae6d4d15034`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #786.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #786 and live-installed 0.423.0.
2. Continue a11y form labels.
