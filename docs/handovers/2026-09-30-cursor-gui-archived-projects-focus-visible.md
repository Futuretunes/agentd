# 2026-09-30 — 0.498.0: Archived projects focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Archived projects focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.498.0
- Implementation commit(s): 2d595a7
- PR: #931

## Changes and relevant files

- See feature PR #931.
- Package 0.498.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #931; live-installed on 192.168.1.20 (0.498.0 / 2d595a78da0a68d9674814bcfad061c405c0ea93).
- Archive SHA-256: `fc9ab0ad4bb8112ee55e05d9bc1fe586d64c7b880a53d7c172fd5af266d636a3`
- Revision: `2d595a78da0a68d9674814bcfad061c405c0ea93`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #931.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #931 and live-installed 0.498.0.
2. Continue a11y form labels.
