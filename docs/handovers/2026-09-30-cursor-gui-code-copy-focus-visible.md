# 2026-09-30 — 0.411.0: Code copy focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Code copy focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.411.0
- Implementation commit(s): 20acfa7
- PR: #762

## Changes and relevant files

- See feature PR #762.
- Package 0.411.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #762; live-installed on 192.168.1.20 (0.411.0 / 20acfa7bf162e452d1e87098d4693db6b1d2d9b7).
- Archive SHA-256: `bffdf5e9cc04cc3d9e86909c0039fa50f06f9d6a9fe1847cea7ef4e83f3b4ee9`
- Revision: `20acfa7bf162e452d1e87098d4693db6b1d2d9b7`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #762.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #762 and live-installed 0.411.0.
2. Continue a11y form labels.
