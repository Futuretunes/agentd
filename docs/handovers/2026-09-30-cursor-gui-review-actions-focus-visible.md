# 2026-09-30 — 0.467.0: Review actions focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review actions focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.467.0
- Implementation commit(s): dc4e722
- PR: #871

## Changes and relevant files

- See feature PR #871.
- Package 0.467.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #871; live-installed on 192.168.1.20 (0.467.0 / dc4e722ef8148a66439e0f2497db6fa27984a902).
- Archive SHA-256: `7274e87211896738162d32d321620bd9a805d9cb71049be63a45a9d75be88cc6`
- Revision: `dc4e722ef8148a66439e0f2497db6fa27984a902`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #871.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #871 and live-installed 0.467.0.
2. Continue a11y form labels.
