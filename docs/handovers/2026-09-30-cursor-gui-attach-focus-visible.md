# 2026-09-30 — 0.515.0: Attach control focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Attach control focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.515.0
- Implementation commit(s): f9ff55b
- PR: #965

## Changes and relevant files

- See feature PR #965.
- Package 0.515.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #965; live-installed on 192.168.1.20 (0.515.0 / f9ff55b7ee11577b9aa6ff28f9983d4f36297d0c).
- Archive SHA-256: `3d4278c6916e46d5fa2b7f4a814da6144ae54c75c149be75fe861b0768eb0082`
- Revision: `f9ff55b7ee11577b9aa6ff28f9983d4f36297d0c`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #965.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #965 and live-installed 0.515.0.
2. Continue a11y form labels.
