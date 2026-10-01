# 2026-09-30 — 0.512.0: Access key input focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Access key input focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.512.0
- Implementation commit(s): cb07e55
- PR: #959

## Changes and relevant files

- See feature PR #959.
- Package 0.512.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #959; live-installed on 192.168.1.20 (0.512.0 / cb07e55abc156d6f16ff6dd6bd07f6a28d180bff).
- Archive SHA-256: `0dc4022e596fbab5313327d56567ddeaab1eba1822684f91102f2430dcd9754b`
- Revision: `cb07e55abc156d6f16ff6dd6bd07f6a28d180bff`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #959.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #959 and live-installed 0.512.0.
2. Continue a11y form labels.
