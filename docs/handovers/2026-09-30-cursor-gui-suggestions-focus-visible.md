# 2026-09-30 — 0.542.0: Suggestions focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Suggestions focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.542.0
- Implementation commit(s): 668a556
- PR: #1018

## Changes and relevant files

- See feature PR #1018.
- Package 0.542.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1018; live-installed on 192.168.1.20 (0.542.0 / 668a556d3e2e172e1b86f0491b48f17837857c6e).
- Archive SHA-256: `bafb4bd733d19fc1540429e33fb2e7b3f1a9d06c8b82449035ccba5e8b4d49ec`
- Revision: `668a556d3e2e172e1b86f0491b48f17837857c6e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1018.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1018 and live-installed 0.542.0.
2. Continue a11y form labels.
