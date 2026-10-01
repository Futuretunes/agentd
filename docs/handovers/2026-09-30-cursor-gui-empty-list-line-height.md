# 2026-09-30 — 0.589.0: Empty list line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Empty list line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.589.0
- Implementation commit(s): 1d5519b
- PR: #1112

## Changes and relevant files

- See feature PR #1112.
- Package 0.589.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1112; live-installed on 192.168.1.20 (0.589.0 / 1d5519b0a59d532a5c206935793d98114457b64c).
- Archive SHA-256: `b767dbe80a7c7e9680cf10da29254367027708ded188ff30243200712a9cd5a6`
- Revision: `1d5519b0a59d532a5c206935793d98114457b64c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1112.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1112 and live-installed 0.589.0.
2. Continue a11y form labels.
