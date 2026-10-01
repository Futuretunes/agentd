# 2026-09-30 — 0.540.0: Phone input font size (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone input font size
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.540.0
- Implementation commit(s): 1b9581e
- PR: #1014

## Changes and relevant files

- See feature PR #1014.
- Package 0.540.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1014; live-installed on 192.168.1.20 (0.540.0 / 1b9581e90b4f8e33f3715f4acf82de4093f24d4a).
- Archive SHA-256: `2726c90f4438cea1fb56acfa355ed35e93d67add3f6264a9379ca16dfce1b9b6`
- Revision: `1b9581e90b4f8e33f3715f4acf82de4093f24d4a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1014.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1014 and live-installed 0.540.0.
2. Continue a11y form labels.
