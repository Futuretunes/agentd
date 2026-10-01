# 2026-09-30 — 0.534.0: Phone sign-in touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone sign-in touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.534.0
- Implementation commit(s): 5e6a951
- PR: #1002

## Changes and relevant files

- See feature PR #1002.
- Package 0.534.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1002; live-installed on 192.168.1.20 (0.534.0 / 5e6a951d4dc4187ef2a69e816fef1e2bad18bc5d).
- Archive SHA-256: `79a3f4692512ad0d42c2349d510e32a8b5552c78ea34e3b90fc5dfe943b6980d`
- Revision: `5e6a951d4dc4187ef2a69e816fef1e2bad18bc5d`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1002.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1002 and live-installed 0.534.0.
2. Continue a11y form labels.
