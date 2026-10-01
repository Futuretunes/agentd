# 2026-09-30 — 0.368.0: Large review file row accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Large review file row accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.368.0
- Implementation commit(s): ae91923
- PR: #676

## Changes and relevant files

- See feature PR #676.
- Package 0.368.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #676; live-installed on 192.168.1.20 (0.368.0 / ae919236a3ac4a06ca7c6e1c189a1ae0eef2cc41).
- Archive SHA-256: `f311e797288aeaa57b99d3227fa62fb0eb01900c9e882a8d76a851857592509e`
- Revision: `ae919236a3ac4a06ca7c6e1c189a1ae0eef2cc41`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #676.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #676 and live-installed 0.368.0.
2. Continue a11y form labels.
