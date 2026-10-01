# 2026-09-30 — 0.390.0: Paginated review diff accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Paginated review diff accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.390.0
- Implementation commit(s): 3b33454
- PR: #720

## Changes and relevant files

- See feature PR #720.
- Package 0.390.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #720; live-installed on 192.168.1.20 (0.390.0 / 3b3345464ed51b8f2a753f2de87f9d64b786fae7).
- Archive SHA-256: `c525557528a0b13d4b8b7c713ab15405f7ef745de4b92df8d7a80391d83c99c2`
- Revision: `3b3345464ed51b8f2a753f2de87f9d64b786fae7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #720.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #720 and live-installed 0.390.0.
2. Continue a11y form labels.
