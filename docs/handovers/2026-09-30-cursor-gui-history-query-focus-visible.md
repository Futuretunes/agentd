# 2026-09-30 — 0.507.0: History query focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History query focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.507.0
- Implementation commit(s): 0360fbb
- PR: #949

## Changes and relevant files

- See feature PR #949.
- Package 0.507.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #949; live-installed on 192.168.1.20 (0.507.0 / 0360fbb0dd6eaac7d3132a730f705534de22f751).
- Archive SHA-256: `e7621a9bbdec9207ec833c0f5d6e9de4bd458f0794b09301d919bbe92c5d5360`
- Revision: `0360fbb0dd6eaac7d3132a730f705534de22f751`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #949.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #949 and live-installed 0.507.0.
2. Continue a11y form labels.
