# 2026-09-30 — 0.360.0: Set ntfy destination form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Set ntfy destination form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.360.0
- Implementation commit(s): 95a7642
- PR: #661

## Changes and relevant files

- See feature PR #661.
- Package 0.360.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #661; live-installed on 192.168.1.20 (0.360.0 / 95a76426b7a7efa9f05613db64612c3497d68fbc).
- Archive SHA-256: `6a6a9c7f6a1ae35db7fea97d92794a38bcf6ae73c3c089524e7a72b4e98a59b6`
- Revision: `95a76426b7a7efa9f05613db64612c3497d68fbc`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #661.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #661 and live-installed 0.360.0.
2. Continue a11y form labels.
