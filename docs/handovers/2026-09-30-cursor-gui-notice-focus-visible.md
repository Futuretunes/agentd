# 2026-09-30 — 0.458.0: Page notice focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Page notice focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.458.0
- Implementation commit(s): 355ef48
- PR: #854

## Changes and relevant files

- See feature PR #854.
- Package 0.458.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #854; live-installed on 192.168.1.20 (0.458.0 / 355ef48a4b8a354bee19d2951032d2b582ea2021).
- Archive SHA-256: `b47bda0474c9d87fef2ab49c96d46d8c4d8b75bc9269e81eb8496a5c7bfa9bbc`
- Revision: `355ef48a4b8a354bee19d2951032d2b582ea2021`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #854.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #854 and live-installed 0.458.0.
2. Continue a11y form labels.
