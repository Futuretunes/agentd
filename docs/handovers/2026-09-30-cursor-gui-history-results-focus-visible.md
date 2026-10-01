# 2026-09-30 — 0.496.0: History results focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: History results focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.496.0
- Implementation commit(s): 44f49f0
- PR: #927

## Changes and relevant files

- See feature PR #927.
- Package 0.496.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #927; live-installed on 192.168.1.20 (0.496.0 / 44f49f04758835c55fe7f7f0517dd13925772a50).
- Archive SHA-256: `b8ce6c55a02d9dfdd5d074a6ad935f8fa2dcdae8161da3bfeb4483b5a18d6ba7`
- Revision: `44f49f04758835c55fe7f7f0517dd13925772a50`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #927.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #927 and live-installed 0.496.0.
2. Continue a11y form labels.
