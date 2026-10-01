# 2026-09-30 — 0.445.0: Account dialog focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Account dialog focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.445.0
- Implementation commit(s): 099ca11
- PR: #828

## Changes and relevant files

- See feature PR #828.
- Package 0.445.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #828; live-installed on 192.168.1.20 (0.445.0 / 099ca114a4eae1dd388cc9d0f51730c720121ea7).
- Archive SHA-256: `9eef4a07ec577fe8fba60998f6bf249382eae747195ff4984eeb0b6e0af94059`
- Revision: `099ca114a4eae1dd388cc9d0f51730c720121ea7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #828.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #828 and live-installed 0.445.0.
2. Continue a11y form labels.
