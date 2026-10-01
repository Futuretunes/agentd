# 2026-09-30 — 0.413.0: Composer tools focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Composer tools focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.413.0
- Implementation commit(s): 4d7370f
- PR: #766

## Changes and relevant files

- See feature PR #766.
- Package 0.413.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #766; live-installed on 192.168.1.20 (0.413.0 / 4d7370f78e4f487487b79ec80ac1000e07e40926).
- Archive SHA-256: `00ea55c97a6b4b2436e9f6161748772d044b36a4d6a633255f899ce129e7e614`
- Revision: `4d7370f78e4f487487b79ec80ac1000e07e40926`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #766.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #766 and live-installed 0.413.0.
2. Continue a11y form labels.
