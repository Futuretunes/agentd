# 2026-09-30 — 0.562.0: Phone answer line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone answer line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.562.0
- Implementation commit(s): 8929835
- PR: #1058

## Changes and relevant files

- See feature PR #1058.
- Package 0.562.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1058; live-installed on 192.168.1.20 (0.562.0 / 8929835d6166e99a3b9d8380639de1af3ef6c841).
- Archive SHA-256: `ac8fbc399fadc7fed24069a9d3522ab2765a8c686abb6ed3bd2e9d6cac567ba9`
- Revision: `8929835d6166e99a3b9d8380639de1af3ef6c841`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1058.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1058 and live-installed 0.562.0.
2. Continue a11y form labels.
