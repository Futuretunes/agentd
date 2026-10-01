# 2026-09-30 — 0.369.0: 0.369.0 remove misplaced large-review row aria-label from click handler. (#678) (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: 0.369.0 remove misplaced large-review row aria-label from click handler. (#678)
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.369.0
- Implementation commit(s): 4cc9b1d
- PR: #678

## Changes and relevant files

- See feature PR #678.
- Package 0.369.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #678; live-installed on 192.168.1.20 (0.369.0 / 4cc9b1d4fa7a5b58112fb7a5c3e4c7aa6311f637).
- Archive SHA-256: `3d6fcff265028d604253f87a34704e19c929e937f7fa30c765844bba71bcc9ac`
- Revision: `4cc9b1d4fa7a5b58112fb7a5c3e4c7aa6311f637`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #678.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #678 and live-installed 0.369.0.
2. Continue a11y form labels.
