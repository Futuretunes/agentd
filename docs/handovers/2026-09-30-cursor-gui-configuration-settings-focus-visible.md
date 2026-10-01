# 2026-09-30 — 0.492.0: Configuration settings focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration settings focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.492.0
- Implementation commit(s): 95be525
- PR: #919

## Changes and relevant files

- See feature PR #919.
- Package 0.492.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #919; live-installed on 192.168.1.20 (0.492.0 / 95be5252b705504662493d5d8e4ceb1d7751f1ae).
- Archive SHA-256: `115decbb2e4b50de537c5d4757a1f5819602305e5ebb73c299d25666e18677f0`
- Revision: `95be5252b705504662493d5d8e4ceb1d7751f1ae`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #919.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #919 and live-installed 0.492.0.
2. Continue a11y form labels.
