# 2026-09-30 — 0.567.0: Phone code-block touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone code-block touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.567.0
- Implementation commit(s): 41ac50d
- PR: #1068

## Changes and relevant files

- See feature PR #1068.
- Package 0.567.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1068; live-installed on 192.168.1.20 (0.567.0 / 41ac50d75aed0e6450aba9b7eee7fa21b688c8a1).
- Archive SHA-256: `8dee097d89e593151722d3a3273ea17066a7eea70f3fdbdc1089f1bf96e4375d`
- Revision: `41ac50d75aed0e6450aba9b7eee7fa21b688c8a1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1068.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1068 and live-installed 0.567.0.
2. Continue a11y form labels.
