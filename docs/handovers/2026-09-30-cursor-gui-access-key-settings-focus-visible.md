# 2026-09-30 — 0.489.0: Access key settings focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Access key settings focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.489.0
- Implementation commit(s): 5971090
- PR: #913

## Changes and relevant files

- See feature PR #913.
- Package 0.489.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #913; live-installed on 192.168.1.20 (0.489.0 / 5971090b6358ca76bc87a90f1d7c362b9f7e474e).
- Archive SHA-256: `ad377268170483af054034705fd9648ea98a04ab378964c7a2c3ba8f87a971bf`
- Revision: `5971090b6358ca76bc87a90f1d7c362b9f7e474e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #913.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #913 and live-installed 0.489.0.
2. Continue a11y form labels.
