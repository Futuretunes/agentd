# 2026-09-30 — 0.478.0: Diagnostics content focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Diagnostics content focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.478.0
- Implementation commit(s): 47f47d1
- PR: #892

## Changes and relevant files

- See feature PR #892.
- Package 0.478.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #892; live-installed on 192.168.1.20 (0.478.0 / 47f47d17d0b7f1664f2482d953ba0b7cb6f435f3).
- Archive SHA-256: `676a5bf6f683d6286d8195493b3d1f1714d74b37fa77716fc86831baf8d8934b`
- Revision: `47f47d17d0b7f1664f2482d953ba0b7cb6f435f3`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #892.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #892 and live-installed 0.478.0.
2. Continue a11y form labels.
