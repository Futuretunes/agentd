# 2026-09-30 — 0.565.0: Phone prompt min-height (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone prompt min-height
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.565.0
- Implementation commit(s): 7b634ed
- PR: #1064

## Changes and relevant files

- See feature PR #1064.
- Package 0.565.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1064; live-installed on 192.168.1.20 (0.565.0 / 7b634ed7d4593e2e374c1f842db79064cad5e517).
- Archive SHA-256: `13c8344abcde59670cfccc21d6aaf73611bf0e9fd395983d04fe9bf0d0fb79ff`
- Revision: `7b634ed7d4593e2e374c1f842db79064cad5e517`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1064.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1064 and live-installed 0.565.0.
2. Continue a11y form labels.
