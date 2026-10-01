# 2026-09-30 — 0.485.0: Publication confirm form focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Publication confirm form focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.485.0
- Implementation commit(s): 9a27317
- PR: #905

## Changes and relevant files

- See feature PR #905.
- Package 0.485.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #905; live-installed on 192.168.1.20 (0.485.0 / 9a2731706ec3b6273544c208b2ef5624a45fc222).
- Archive SHA-256: `74a392e5638fc5a60cf8caf2fb8e1efeea7a80f4c47a59e125f6291ed84e0580`
- Revision: `9a2731706ec3b6273544c208b2ef5624a45fc222`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #905.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #905 and live-installed 0.485.0.
2. Continue a11y form labels.
