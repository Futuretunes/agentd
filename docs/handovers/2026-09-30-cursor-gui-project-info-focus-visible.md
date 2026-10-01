# 2026-09-30 — 0.499.0: Project information focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Project information focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.499.0
- Implementation commit(s): 3a147ea
- PR: #933

## Changes and relevant files

- See feature PR #933.
- Package 0.499.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #933; live-installed on 192.168.1.20 (0.499.0 / 3a147ea1c034fea765ba4f54ae94aff2610579ae).
- Archive SHA-256: `b00eac6b9ad99626e439a5feeb49f20e0875117414d7f8a2176bbdaccb197ac1`
- Revision: `3a147ea1c034fea765ba4f54ae94aff2610579ae`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #933.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #933 and live-installed 0.499.0.
2. Continue a11y form labels.
