# 2026-09-30 — 0.580.0: Phone disclosure summary touch target (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Phone disclosure summary touch target
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.580.0
- Implementation commit(s): 0f224dd
- PR: #1094

## Changes and relevant files

- See feature PR #1094.
- Package 0.580.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #1094; live-installed on 192.168.1.20 (0.580.0 / 0f224ddd0274e6008de0d567c69bd984df2704b0).
- Archive SHA-256: `438f8a6df5742ced4c18d36eb5cb87cc4907abf1475f8458e40a058e570eb1fb`
- Revision: `0f224ddd0274e6008de0d567c69bd984df2704b0`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #1094.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #1094 and live-installed 0.580.0.
2. Continue a11y form labels.
