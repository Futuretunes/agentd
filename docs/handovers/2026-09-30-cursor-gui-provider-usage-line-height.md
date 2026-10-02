# 2026-09-30 — 0.594.0: Provider usage line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Provider usage line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.594.0
- Implementation commit(s): 4ad6ddc
- PR: #1122

## Changes and relevant files

- See feature PR #1122.
- Package 0.594.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1122; live-installed on 192.168.1.20 (0.594.0 / 4ad6ddc89f008eef3a36071f126df4d1e6e9f10a).
- Archive SHA-256: `cc9a1d87975de4eaf30b649de2c20c6a88ede1493e3e7e147c8884784ff4ef61`
- Revision: `4ad6ddc89f008eef3a36071f126df4d1e6e9f10a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1122.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1122 and live-installed 0.594.0.
2. Continue a11y form labels.
