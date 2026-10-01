# 2026-09-30 — 0.532.0: Phone turn actions touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone turn actions touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.532.0
- Implementation commit(s): ef9f6b7
- PR: #998

## Changes and relevant files

- See feature PR #998.
- Package 0.532.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #998; live-installed on 192.168.1.20 (0.532.0 / ef9f6b7072dd3b30a13e75fe6976c8b4d14986f1).
- Archive SHA-256: `4b32d3e70ec21068a505999aba192873ac553c06d3fa140e249684f035985031`
- Revision: `ef9f6b7072dd3b30a13e75fe6976c8b4d14986f1`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #998.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #998 and live-installed 0.532.0.
2. Continue a11y form labels.
