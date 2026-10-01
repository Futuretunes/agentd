# 2026-09-30 — 0.487.0: Sign-in form focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Sign-in form focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.487.0
- Implementation commit(s): 530a5bc
- PR: #909

## Changes and relevant files

- See feature PR #909.
- Package 0.487.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #909; live-installed on 192.168.1.20 (0.487.0 / 530a5bcc2027db87644a767879e1a6605a36c5fd).
- Archive SHA-256: `4cc552fc3ad6ff5dd1b96bfa0acfb4d490c2217db700fbc8f8fe2c6bf1c877f9`
- Revision: `530a5bcc2027db87644a767879e1a6605a36c5fd`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #909.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #909 and live-installed 0.487.0.
2. Continue a11y form labels.
