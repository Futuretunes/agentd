# 2026-09-30 — 0.521.0: High-contrast focus ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: High-contrast focus ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.521.0
- Implementation commit(s): 9748f1c
- PR: #977

## Changes and relevant files

- See feature PR #977.
- Package 0.521.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #977; live-installed on 192.168.1.20 (0.521.0 / 9748f1c5d76b440b2fad0ba864fb8ecd0df0a96f).
- Archive SHA-256: `774d36c61fc9fb91948631854e8474377ad22235c6972f2dc07a301fd7350f7e`
- Revision: `9748f1c5d76b440b2fad0ba864fb8ecd0df0a96f`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #977.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #977 and live-installed 0.521.0.
2. Continue a11y form labels.
