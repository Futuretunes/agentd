# 2026-09-30 — 0.398.0: File review diff accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: File review diff accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.398.0
- Implementation commit(s): e8c16fc
- PR: #736

## Changes and relevant files

- See feature PR #736.
- Package 0.398.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #736; live-installed on 192.168.1.20 (0.398.0 / e8c16fca65b1d564991e7c8e72b82a18c4504f8f).
- Archive SHA-256: `96da8a579db01b9225ca910436bcf6e275ef144bb36c28fa0d110e56650ae1c0`
- Revision: `e8c16fca65b1d564991e7c8e72b82a18c4504f8f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #736.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #736 and live-installed 0.398.0.
2. Continue a11y form labels.
