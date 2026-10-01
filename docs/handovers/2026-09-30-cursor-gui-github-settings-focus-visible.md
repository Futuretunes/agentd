# 2026-09-30 — 0.495.0: GitHub settings focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: GitHub settings focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.495.0
- Implementation commit(s): ccdbf82
- PR: #925

## Changes and relevant files

- See feature PR #925.
- Package 0.495.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #925; live-installed on 192.168.1.20 (0.495.0 / ccdbf82e08fc89462fadc2a6a683edcc0d5ec004).
- Archive SHA-256: `9b31be0579b401f2c49c73cba86f6e9463e43483eb0a5c5f4d2bd52616bb4377`
- Revision: `ccdbf82e08fc89462fadc2a6a683edcc0d5ec004`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #925.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #925 and live-installed 0.495.0.
2. Continue a11y form labels.
