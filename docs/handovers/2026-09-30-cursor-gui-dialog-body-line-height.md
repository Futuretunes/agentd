# 2026-09-30 — 0.528.0: Dialog content line-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Dialog content line-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.528.0
- Implementation commit(s): f4597f6
- PR: #990

## Changes and relevant files

- See feature PR #990.
- Package 0.528.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #990; live-installed on 192.168.1.20 (0.528.0 / f4597f64945d380f0660167694a6b0c1b68813d4).
- Archive SHA-256: `12d6f604ee6bcac533cc2cba2b3a4c4ad17ea556bc19aab5056d6ba6520f2486`
- Revision: `f4597f64945d380f0660167694a6b0c1b68813d4`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #990.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #990 and live-installed 0.528.0.
2. Continue a11y form labels.
