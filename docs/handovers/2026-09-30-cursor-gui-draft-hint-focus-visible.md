# 2026-09-30 — 0.503.0: Draft hint focus-visible ring (UX-4 / U19)

- Author/agent: Cursor
- Requested outcome: Draft hint focus-visible ring
- Status: implemented; live-installed on 192.168.1.20
- Release: 0.503.0
- Implementation commit(s): 69c1f63
- PR: #941

## Changes and relevant files

- See feature PR #941.
- Package 0.503.0; source assertion in `test/ui.test.mjs`.

## Validation evidence

- CI green on #941; live-installed on 192.168.1.20 (0.503.0 / 69c1f6371a7b091fa6c656e251b82bc0572a91b9).
- Archive SHA-256: `d7f683fca3d89702e141562829e3811c372f0eabc0b06f43e0745a480b30273e`
- Revision: `69c1f6371a7b091fa6c656e251b82bc0572a91b9`

- `node --test test/ui.test.mjs`

## Deployment and rollback

Live-installed on 192.168.1.20. Rollback is prior release / revert of #941.

## Constraints and known issues

None beyond ordinary accessible naming.

## Next steps

1. Done: merged #941 and live-installed 0.503.0.
2. Continue a11y form labels.
