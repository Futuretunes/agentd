# 2026-09-30 — 0.431.0: CLI dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: CLI dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.431.0
- Implementation commit(s): c8d358f
- PR: #801

## Changes and relevant files

- See feature PR #801.
- Package 0.431.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #801; live-installed on 192.168.1.20 (0.431.0 / c8d358f7e6aad1cee4976aff2a47f8a97ce163cb).
- Archive SHA-256: `c9910436b035f000bf2d3bfe098c76f835e6370cf98ad61f1592d6dd96b8d990`
- Revision: `c8d358f7e6aad1cee4976aff2a47f8a97ce163cb`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #801.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #801 and live-installed 0.431.0.
2. Continue a11y form labels.
