# 2026-09-30 — 0.526.0: Phone run picker touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone run picker touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.526.0
- Implementation commit(s): dc455d2
- PR: #987

## Changes and relevant files

- See feature PR #987.
- Package 0.526.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #987; live-installed on 192.168.1.20 (0.526.0 / dc455d237296151e615160fbb7bc9f2a06ef7536).
- Archive SHA-256: `1b5333fdfa3030ae4d9d445f3a95f23174086b8947130a5c72c83688a3e8382f`
- Revision: `dc455d237296151e615160fbb7bc9f2a06ef7536`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #987.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #987 and live-installed 0.526.0.
2. Continue a11y form labels.
