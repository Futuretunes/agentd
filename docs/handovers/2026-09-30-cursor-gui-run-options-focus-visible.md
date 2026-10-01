# 2026-09-30 — 0.460.0: Run options focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Run options focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.460.0
- Implementation commit(s): 8234d6c
- PR: #858

## Changes and relevant files

- See feature PR #858.
- Package 0.460.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #858; live-installed on 192.168.1.20 (0.460.0 / 8234d6c0c4d07a2f39f313b299f0d98a7698f15b).
- Archive SHA-256: `63e701cc5d4284bcd5168f63599d1a2a7d769c9bc8aa3c123b80d799c885ae2b`
- Revision: `8234d6c0c4d07a2f39f313b299f0d98a7698f15b`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #858.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #858 and live-installed 0.460.0.
2. Continue a11y form labels.
