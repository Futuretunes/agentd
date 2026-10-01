# 2026-09-30 — 0.396.0: Update progress accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Update progress accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.396.0
- Implementation commit(s): 1c57b76
- PR: #732

## Changes and relevant files

- See feature PR #732.
- Package 0.396.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #732; live-installed on 192.168.1.20 (0.396.0 / 1c57b76246bb243c5781b1219f8a9f905a7b6d69).
- Archive SHA-256: `4138ae8d402908972dda0fb9486de3c1305aa3aa76966a68456b8b42ea120f81`
- Revision: `1c57b76246bb243c5781b1219f8a9f905a7b6d69`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #732.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #732 and live-installed 0.396.0.
2. Continue a11y form labels.
