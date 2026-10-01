# 2026-09-30 — 0.451.0: Projects list focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Projects list focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.451.0
- Implementation commit(s): 618474c
- PR: #840

## Changes and relevant files

- See feature PR #840.
- Package 0.451.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #840; live-installed on 192.168.1.20 (0.451.0 / 618474cb0fe2c9dee5c0af5e26c4f4f488729075).
- Archive SHA-256: `84a50168aa8b5f55ffc782e1acf741f9757b2cb5726bfadcd76c3109759afd00`
- Revision: `618474cb0fe2c9dee5c0af5e26c4f4f488729075`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #840.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #840 and live-installed 0.451.0.
2. Continue a11y form labels.
