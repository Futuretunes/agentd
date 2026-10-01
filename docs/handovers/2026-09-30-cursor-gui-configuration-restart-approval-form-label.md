# 2026-09-30 — 0.355.0: Configuration restart approval form accessible name (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Configuration restart approval form accessible name
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.355.0
- Implementation commit(s): 0d406b4
- PR: #651

## Changes and relevant files

- See feature PR #651.
- Package 0.355.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #651; live-installed on 192.168.1.20 (0.355.0 / 0d406b4a12c5fa77a6a066657b4a168980241fba).
- Archive SHA-256: `0609e97f76bb917aca082be0810e237a0dc642a1f68d69cc898a42162abebdc2`
- Revision: `0d406b4a12c5fa77a6a066657b4a168980241fba`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #651.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #651 and live-installed 0.355.0.
2. Continue a11y form labels.
