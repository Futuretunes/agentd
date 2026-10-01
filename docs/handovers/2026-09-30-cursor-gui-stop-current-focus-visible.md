# 2026-09-30 — 0.514.0: Stop control focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Stop control focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.514.0
- Implementation commit(s): 031ec60
- PR: #963

## Changes and relevant files

- See feature PR #963.
- Package 0.514.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #963; live-installed on 192.168.1.20 (0.514.0 / 031ec60af28ae30ef3a39e15c96184b3393719bd).
- Archive SHA-256: `4153b64f6155211691f56b7cc610623a8cdb6b705f985a24e27b85dc109924aa`
- Revision: `031ec60af28ae30ef3a39e15c96184b3393719bd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #963.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #963 and live-installed 0.514.0.
2. Continue a11y form labels.
