# 2026-09-30 — 0.533.0: Phone dialog form touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone dialog form touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.533.0
- Implementation commit(s): 8286c7d
- PR: #1000

## Changes and relevant files

- See feature PR #1000.
- Package 0.533.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1000; live-installed on 192.168.1.20 (0.533.0 / 8286c7dd90e46e4144d02f1c38acbe26ad38f95a).
- Archive SHA-256: `7e45ae2cd90325027d49e1d8001cff82bc9c7df453959a9b2a720b08d97b32b6`
- Revision: `8286c7dd90e46e4144d02f1c38acbe26ad38f95a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1000.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1000 and live-installed 0.533.0.
2. Continue a11y form labels.
