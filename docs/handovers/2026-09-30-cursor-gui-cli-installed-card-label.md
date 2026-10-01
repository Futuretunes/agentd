# 2026-09-30 — 0.372.0: Installed CLI card accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Installed CLI card accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.372.0
- Implementation commit(s): 0015d85
- PR: #684

## Changes and relevant files

- See feature PR #684.
- Package 0.372.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #684; live-installed on 192.168.1.20 (0.372.0 / 0015d85f0d8359f8f5cc79b4147f81b9307f9f0a).
- Archive SHA-256: `4a1c182f5d06d8045fed8654877b7dc020ee3c199d9af02c4be5055736689d5d`
- Revision: `0015d85f0d8359f8f5cc79b4147f81b9307f9f0a`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #684.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #684 and live-installed 0.372.0.
2. Continue a11y form labels.
