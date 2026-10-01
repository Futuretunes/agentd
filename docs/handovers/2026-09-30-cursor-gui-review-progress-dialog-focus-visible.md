# 2026-09-30 — 0.450.0: Review progress dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Review progress dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.450.0
- Implementation commit(s): 73bcd1c
- PR: #838

## Changes and relevant files

- See feature PR #838.
- Package 0.450.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #838; live-installed on 192.168.1.20 (0.450.0 / 73bcd1cbd433fa646b8b78faf63841979a6709bd).
- Archive SHA-256: `77d9cd515590492b137b88cf9762ff23bc00e1143eef31d12e82ffcf423e8ee6`
- Revision: `73bcd1cbd433fa646b8b78faf63841979a6709bd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #838.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #838 and live-installed 0.450.0.
2. Continue a11y form labels.
