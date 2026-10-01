# 2026-09-30 — 0.419.0: Agent picker focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Agent picker focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.419.0
- Implementation commit(s): 04ac6c3
- PR: #778

## Changes and relevant files

- See feature PR #778.
- Package 0.419.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #778; live-installed on 192.168.1.20 (0.419.0 / 04ac6c3002800bdaa5233130801243b2b8dd8d6e).
- Archive SHA-256: `1cb158c8236a9c39991452c902e8572c9e23b54da55dc84f2109fa502e100dce`
- Revision: `04ac6c3002800bdaa5233130801243b2b8dd8d6e`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #778.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #778 and live-installed 0.419.0.
2. Continue a11y form labels.
