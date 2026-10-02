# 2026-09-30 — 0.590.0: Phone danger button touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone danger button touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.590.0
- Implementation commit(s): 088aaf9
- PR: #1114

## Changes and relevant files

- See feature PR #1114.
- Package 0.590.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1114; live-installed on 192.168.1.20 (0.590.0 / 088aaf94b580ae234d9623ba97f19229b37ed6b8).
- Archive SHA-256: `1d87b63d426c0ff14ad03197a739aab47f22fef1dd032e5c39081c738d23b9a6`
- Revision: `088aaf94b580ae234d9623ba97f19229b37ed6b8`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1114.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1114 and live-installed 0.590.0.
2. Continue a11y form labels.
