# 2026-09-30 — 0.393.0: Publication commit patch accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication commit patch accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.393.0
- Implementation commit(s): 04e7428
- PR: #726

## Changes and relevant files

- See feature PR #726.
- Package 0.393.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #726; live-installed on 192.168.1.20 (0.393.0 / 04e742809fdb269c0d68120ddb79636ea76874e5).
- Archive SHA-256: `e90fca03ee206a175c20e68e80f15719b0a7edf3f72a496a89893854aa9188b8`
- Revision: `04e742809fdb269c0d68120ddb79636ea76874e5`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #726.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #726 and live-installed 0.393.0.
2. Continue a11y form labels.
